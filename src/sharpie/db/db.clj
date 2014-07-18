(ns sharpie.db.db
  (:require [clojure.java.jdbc :as jdbc]
            [java-jdbc.ddl :as ddl]
            [java-jdbc.sql :as sql]))

(def db-url "")
(def db (or (System/getenv "DATABASE_URL") db-url))

(defn uuid [] (str (java.util.UUID/randomUUID)))

(defn migrated-noun? []
  (-> (jdbc/query db
                 [(str "select count(*) from information_schema.tables "
                       "where table_name='nouns'")])
      first :count pos?))

(defn migrated-brown? []
  (-> (jdbc/query db
                 [(str "select count(*) from information_schema.tables "
                       "where table_name='browns'")])
      first :count pos?))

(defn migrate-nouns []
  (when-not (migrated-noun?)
  (jdbc/db-do-commands db
                       (ddl/create-table :nouns
                                         [:id :serial "PRIMARY KEY"]
                                         [:name "varchar(25)" "NOT NULL"]
                                         ))))

(defn migrate-browns []
  (when-not (migrated-brown?)
  (jdbc/db-do-commands db
                       (ddl/create-table :browns
                                         [:id :serial "PRIMARY KEY"]
                                         [:brown "varchar(25)" "NOT NULL"]
                                         ))))


(defn drop-table [table]
  (try
    (jdbc/db-do-commands db
                         (str "drop table " table))
    (catch Exception _)))

(defn create-noun [{:keys [name]}]
  (try
    (jdbc/insert! db :nouns
                  [:name]
                  [name])
    (catch Exception _)))

(defn create-brown [{:keys [brown]}]
  (try
    (jdbc/insert! db :browns
                  [:brown]
                  [brown])
    (catch Exception _)))


(defn get-all-nouns []
    (into []
          (jdbc/query db ["SELECT name, id FROM nouns"])))


(defn get-all-browns []
    (into []
          (jdbc/query db ["SELECT brown, id FROM browns"])))

(defn join-noun-brown []
    (into {}
          (jdbc/query db ["SELECT nouns.name, browns.brown FROM nouns INNER JOIN browns ON nouns.id = browns.id"])))

(defn update-noun [{:keys [id name]}]
  (try
    (jdbc/update! db
                  :nouns
                  {:name name}
                  ["id=?" id])
    (catch Exception _)))
