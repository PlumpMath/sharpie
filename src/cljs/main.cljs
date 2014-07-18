(ns sharpie.main
  (:require-macros [cljs.core.async.macros :refer [go go-loop]])
  (:require [cljs.reader :as reader]
            [goog.events :as events]
            [goog.dom :as gdom]
            [cljs.core.async :as async :refer [chan put! pipe unique merge map< filter< alts! <!]]
            [om.core :as om :include-macros true]
            [om.dom :as dom :include-macros true]))
(enable-console-print!)

(defn translator [scale x y z deg]
  (let [transform (str " translate3d(" x "px," y "px," z "px) "
                             "rotate(" deg "deg) "
                             "scale(" scale ")"
                             ) ]

    {:-webkit-transform transform
     :transform transform
     }))
