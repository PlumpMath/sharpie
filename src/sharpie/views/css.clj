(ns sharpie.views.css
  (:require
            [garden.core :as garden]
            [garden.stylesheet :as ss]
            [garden.color :as color]
            [garden.def :as def]))

(defn size
  ([height width]
     {:width width :height height})
  ([size]
   {:width size :height size}))

(defn flex-box
  ([align justify flow]
    {
     :display #{:flex :-webkit-flex}
     :align-items align
     :-webkit-align-items align
     :justify-content justify
     :-webkit-justify-content justify
     :flex-flow flow})
  ([align flow]
    {
     :display #{:flex :-webkit-flex}
     :align-items align
     :-webkit-align-items align
     :justify-content align
     :-webkit-justify-content align
     :flex-flow flow})
  ([align]
   {
    :display #{:flex :-webkit-flex}
    :align-items align
    :-webkit-align-items align
    :justify-content align
    :-webkit-justify-content align
    }
   ))

(def sharpie (garden/css {:vendors ["webkit" "moz" "o" "ms"]}


                          [:html (merge {:font-family "arial"
                                         :margin 0} (size "100%"))]
                          [:.z-index {:z-index "99"}]
                          [:.selected {:color "white"}]
                          [:body {:margin 0}]

                          [:.trans {:transition "all .1s ease-in-out"}]
                          [:.flex ^:prefix (flex-box "center")]
                          [:.column ^:prefix {:flex-flow "column"}]
                          [:.full (size "100%")]
                          [:#app ^:prefix {:perspective "1100px"
                                           :perspective-origin "50% 50%"
                                           :position "relative"
                                           }]
                          [:.half (size "50%")]
                          [:.trans {:transition "all .2s ease-in-out"}]
                          (ss/at-media {:min-width "320px"  :max-width "480px"}
                                       [:.vid-frame (size "50%" "100%")])

                          [:.aboutus-frame (size "100%" "50%")]
                          (ss/at-media {:min-width "320px"  :max-width "480px"}
                                       [:.aboutus-frame (size "50%" "50%")])

                          (ss/at-media {:min-width "320px"  :max-width "480px"}
                                       [:.un-mobile {:display "none"}])))
