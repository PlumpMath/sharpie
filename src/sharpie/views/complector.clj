(ns sharpie.views.complector
  (:require
            [sharpie.views.css :as css]
            [sharpie.views.html :as page]))

(defn sharpie
  []
  (page/sharpie css/sharpie))
