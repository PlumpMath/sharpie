(ns sharpie.server
  (:use compojure.core)
  (:require [compojure.handler :as handler]
            [compojure.route :as route]
            [clojure.java.io :as io]
            [sharpie.views.complector :as views]
            [com.stuartsierra.component :as component]
            [ring.util.response :refer [file-response]]
            [ring.adapter.jetty :refer [run-jetty]]
            [ring.middleware.edn :refer [wrap-edn-params]]
            [ring.middleware.permacookie :refer [wrap-permacookie]]
            [ring.middleware.cookies :refer [wrap-cookies]]
            [clojure.core.async :refer [chan <! >! put! close! go-loop go]]
            [org.httpkit.server :as http-kit]
            [ring.middleware.reload :as reload]
            [ring.util.response :as resp])
  (:import [javax.script
            Invocable
            ScriptEngineManager]))

;; https://github.com/DomKM/omelette as main reference with all this stuff

(defn nashie [edn]
  (let [js (doto (.getEngineByName (ScriptEngineManager.) "nashorn")
                                        ; React requires either "window" or "global" to be defined.
                 (.eval "var global = this")
                 (.eval (-> "public/javascripts/main/app.js"
                            io/resource
                            io/reader)))
            view (.eval js "sharpie.main")
            render-to-string (fn [edn]
                               (.invokeMethod
                                ^Invocable js
                                view
                                "render_to_string"
                                (-> edn
                                    list
                                    object-array)))]
    
    (render-to-string (str edn))))



(defn requester [req]
  (resp/response (nashie {:truth "apples"})))

(defroutes sharpieroutes
  (GET "/" []
       (resp/response (views/sharpie)))
    (route/resources "/" {:root "public"}))

(defrecord Router []
  component/Lifecycle
  (start
    [component]
    (if (:stop! component)
      component
      (assoc component
        :ring-routes sharpieroutes)))
  (stop
    [component]
    (when-let [stop! (:stop! component)]
      (stop!))
    (dissoc component :stop! :ring-routes)))

(defn router
  "Creates a router component.
  Key :ring-routes should be used by an http-kit server."
  []
  (map->Router {}))


(defrecord Server [port]
  component/Lifecycle
  (start
    [component]
    (if (:stop! component)
      component

      (let [server
            (-> component
                :router
                :ring-routes
               wrap-permacookie
                
                handler/site
                (http-kit/run-server {:port (or port 1500)}))]
        (println "Web server running on port " port)
        (assoc component :stop! server :port port))))
  (stop
    [component]
    (when-let [stop! (:stop! component)]
      (stop! :timeout 250))
    (dissoc component :stop! :router)))

(defn server
  "Takes a port number.
  Returns an http-kit server component.
  Requires `(get-in this [:router :ring-routes])` to be a routes."
  [port]
  (map->Server {:port port}))


(defn system
  ([] (system nil))
  ([port]
     
     (component/system-map
           :router (router)
           :server (component/using
                    (server port)
                    [:router]))))

(defn browse [system]
  (println (get-in system [:server :port]))
  (->> (get-in system [:server :port])
       (str "http://localhost:")
       java.net.URI.
       (.browse (java.awt.Desktop/getDesktop))))

(defn -main
  ([]
     (let [strPort (System/getenv "PORT")]
       (-main strPort)))
  ([port]
     
     (let [port (Integer/parseInt port)]
       (-> (system port)
           component/start
           browse))))


