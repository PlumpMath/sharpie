(ns sharpie.main
  (:require-macros [cljs.core.async.macros :refer [go go-loop]])
  (:require [cljs.reader :as reader]
            [goog.events :as events]
            [goog.dom :as gdom]
            [cljs.core.async :as async :refer [chan put! pipe unique merge map< filter< alts! <!]]
            [om-tools.core :refer-macros [defcomponent]]
            [om-tools.dom :as dom :include-macros true]
            [om.dom :as kom :include-macros true]
            [om.core :as om :include-macros true])
  (:import [goog.ui IdGenerator]))


#_(defn translator [scale x y z deg]
  (let [transform (str " translate3d(" x "px," y "px," z "px) "
                             "rotate(" deg "deg) "
                             "scale(" scale ")"
                             ) ]

    {:-webkit-transform transform
     :transform transform
     }))

(def state (atom {:audios [] }))

(defn guid []
  (.getNextUniqueId (.getInstance IdGenerator)))

(defn recorder [owner]
  (let [audio-context (js/AudioContext.)
        recorder #(js/Recorder. % %2)
        start-user-media (fn [stream] (let [input (.createMediaStreamSource audio-context stream)
                                           config #js {:workerPath "javascripts/recorderWorker.js"
                                                       :callback #(print %)
                                                       }] 
                                       (om/set-state! owner :rec (recorder input config))))
        user-media #(.webkitGetUserMedia js/navigator #js {:audio true} % (fn [error] (print error)))
        url js/URL]
    
    (user-media start-user-media)))



(if (exists? js/console)
  (enable-console-print!)
  (set-print-fn! js/print))

;; { :blob blob :play bool :id uuid }

;; controllers? is that the appropriate term? whatever herein are the
;; class of functions that transform my datas

(defn get-next [data id key]
  (loop [thing (@data :audios)]
    (if (= ((first thing) :id) id)
      (if (first (next thing))
        ((first (next thing)) key)
        ((first (@data :audios)) key))
      (recur (next thing)))
    ))

(defn set-next [data id]
  (let [next-id (get-next data id :id)
        play-next (fn [audios]
                    (into [] (map #(if (= next-id (% :id))
                                     (assoc-in (update-in % [:count] inc) [:play] true)
                                     (assoc-in % [:play] false)) audios)))
        ]
    (print next-id)
    (om/transact! data :audios play-next)))

(defn remove-aud [data id]
  (let [notid (fn [audios] (into [] (remove #(= (% :id) id)  audios)))]
      (om/transact! data :audios notid)))


;;

(defcomponent audio-element [{:keys [blob buffer play id] :as data} owner opts]
  (did-update [_ _ {:keys [auto-play] :as state}]
              (let [node (om/get-node owner "audio")
                    otherstate (om/get-state owner)
                    {:keys [play] :as curdata} (om/get-props owner)]
                (print auto-play "other state " (otherstate :auto-play))
                (when auto-play
                  (when play
                    (.play node)))))

  (did-mount [_]
             (let [node (om/get-node owner "audio")
                   url (.createObjectURL js/URL blob)
                   audio-coord (om/get-state owner :audio-coord)
                   auto-play (om/get-state owner :auto-play)]
               (set! (.-src node) url)
               (.addEventListener node "ended" #(do
                                                  (print "i happened")
                                                  (set! (.-currentTime node) 0)
                                                  (put! audio-coord [:next id])))
               
               
               
               ))
  (render-state [_ {:keys [audio-coord]}]
                (dom/div
                 (dom/button {:on-click #(put! audio-coord [:remove id])} "x")
                 (dom/button {:on-click #(.setBuffer (opts :rec) buffer)} "o") 
                 (dom/audio {:ref "audio"
                             
                             :controls true} ""))))


(defcomponent app-view [{:keys [audios auto-play] :as data} owner]
  (init-state [_] {:audio-coord (chan)})
  (will-mount [_]
              (let [audio-coord (om/get-state owner :audio-coord)]
                (go-loop [[key val] (<! audio-coord)]
                         (case key
                           :next (do
                                   (print "on the other side of the chan")
                                   (set-next data val))
                           :remove (remove-aud data val)
                           )
                         (recur (<! audio-coord)))))
  (render-state [_ {:keys [rec audio-coord]}]
                (let [
                      add-buffer-then-wav #(om/transact! data :audios (fn [audios] (conj audios {:blob %2 :buffer %1 :play false :id (guid) :count 0 })))
                      buffer-then-wav (fn [buffer]
                                        (let [add-wav (partial add-buffer-then-wav buffer)]
                                          (.exportWAV rec add-wav)
                                          ))
                      ]
                  (dom/section  {:class "full flex"}   
                                (dom/button {:on-click #(recorder owner)} "fuck")
                                (dom/button {:on-click #(om/transact! data :auto-play not)} "auto-play")
                                (dom/button {:on-click #(.record rec)} "record")
                                (dom/button {:on-click #(.stop rec)} "stop")
                                (dom/button {:on-click #(.clear rec)} "clear")                                
                                (dom/button {:on-click #(.getBuffer rec buffer-then-wav)} "export wave")
                                (dom/section {:class "column flex"}
                                             (om/build-all audio-element audios {:init-state {:audio-coord audio-coord}
                                                                                 :state {:auto-play auto-play}
                                                                                 :opts {:rec rec}
                                                                                 })
                                             )))  
                ))

(om/root
     app-view
     state
     {:target (gdom/getElement "app")
      :tx-listen #(print %)
      })



#_(defn ^:export render-to-string
  "Takes an app state as EDN and returns the HTML for that state.
  It can be invoked from JS as `omelette.view.render_to_string(edn)`."
  [state-edn]
  (->> state-edn
       reader/read-string
       (om/build app-view)
       kom/render-to-str))

