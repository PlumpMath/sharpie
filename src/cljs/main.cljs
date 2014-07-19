(ns sharpie.main
  (:require-macros [cljs.core.async.macros :refer [go go-loop]])
  (:require [cljs.reader :as reader]
            [goog.events :as events]
            [goog.dom :as gdom]
            [cljs.core.async :as async :refer [chan put! pipe unique merge map< filter< alts! <!]]
            [om-tools.core :refer-macros [defcomponent]]
            [om-tools.dom :as dom :include-macros true]
            [om.dom :as kom :include-macros true]
            [om.core :as om :include-macros true]))


#_(defn translator [scale x y z deg]
  (let [transform (str " translate3d(" x "px," y "px," z "px) "
                             "rotate(" deg "deg) "
                             "scale(" scale ")"
                             ) ]

    {:-webkit-transform transform
     :transform transform
     }))

(if (exists? js/console)
  (enable-console-print!)
  (set-print-fn! js/print))


(defcomponent app-view [data owner]
  (render-state [_ _]
             (dom/h1 (data :truth))))


(defn ^:export render-to-string
  "Takes an app state as EDN and returns the HTML for that state.
  It can be invoked from JS as `omelette.view.render_to_string(edn)`."
  [state-edn]
  (->> state-edn
       reader/read-string
       (om/build app-view)
       kom/render-to-str))

