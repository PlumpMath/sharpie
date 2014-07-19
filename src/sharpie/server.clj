(ns sharpie.server
  (:use compojure.core)
  (:require [compojure.handler :as handler]
            [compojure.route :as route]
            [sharpie.views.complector :as views]
            [com.stuartsierra.component :as component]
            [ring.util.response :refer [file-response]]
            [ring.adapter.jetty :refer [run-jetty]]
            [ring.middleware.edn :refer [wrap-edn-params]]
            [clojure.core.async :refer [chan <! >! put! close! go-loop go]]
            [org.httpkit.server :as http-kit]
            [ring.middleware.reload :as reload]
            [ring.util.response :as resp]))

;; component stuff lifted from this repo -> https://github.com/DomKM/omelette

(defroutes sharpieroutes
  (GET "/" []
       "je suis fonctionnelle"
       #_(resp/response (views/sharpie)))
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
               
               handler/site
               (http-kit/run-server {:port port}))]
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
     (print port (class port))
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
     (println port)
     (let [port (Integer/parseInt port)]
       (-> (system port)
           component/start
           browse))))


