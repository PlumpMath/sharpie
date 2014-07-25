
(defproject sharpie "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [compojure "1.1.6"]
                 [clojurenote "0.4.0"]
                 [ring "1.1.8"]
                 [clj-time "0.6.0"]
                 
                 [com.stuartsierra/component "0.2.1"]
                 [org.clojure/core.memoize "0.5.6"]
                 [org.clojure/core.async "0.1.298.0-2a82a1-alpha"]
                 [prismatic/om-tools "0.2.2"]
                 [http-kit "2.1.13"]
                 [org.clojure/clojurescript "0.0-2227"]
                 [garden "1.1.5"]
                 [om "0.6.4"]
                 [org.clojars.cvillecsteele/ring-permacookie-middleware "1.0.0-SNAPSHOT"]
                 [hiccup "1.0.5"]
                 [fogus/ring-edn "0.2.0"]
                 [hiccup-bridge "1.0.0-SNAPSHOT"]
                 [hiccups "0.3.0"]
                 [hum "0.3.0"]]
  :plugins [
            [lein-cljsbuild "1.0.3"]
            ]
  :main sharpie.server

  :cljsbuild {:builds [{:id "dev"
                        :source-paths ["src/cljs"]
                        :compiler {
                                   :preamble ["react/react.js"
                                              "recorder.js"
                                              "web-animations.min.js"
                                              ]
                                   :output-to "resources/public/javascripts/main/app.js"
                                   :output-dir "resources/public/javascripts/main/out"
                                   :source-map "resources/public/javascripts/main/app.js.map"
                                   :optimizations :none
                                   }}

                       {:id "release"
                        :source-paths ["src/cljs"]
                        :compiler {
                                   :output-to "resources/public/javascripts/app.js"
                                   :optimizations :advanced
                                   :pretty-print false
                                   :preamble ["react/react.js"
                                              "recorder.js"
                                              "web-animations.min.js"
                                              ]
                                   :externs [
                                             "recorder.js"
                                             "resources/public/javascripts/audio-externs.js"
                                             "resources/public/javascripts/webrtc_externs.js"
                                             "react/externs/react.js"
                                             ] }}
                       ]})
