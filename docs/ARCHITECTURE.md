# ProCV — Architecture technique

## 1. Vue d'ensemble

ProCV est une application web conteneurisée composée de trois services principaux :

- Frontend React + Vite
- Backend Spring Boot
- Base de données MySQL

L'application est conçue pour être exécutée localement avec Docker Compose et déployée en production à partir d'images publiées sur GitHub Container Registry.

## 2. Architecture

```text
                    Internet
                       |
                       v
              +----------------+
              | Reverse Proxy  |
              | HTTPS / Domain |
              +-------+--------+
                      |
                      v
              +----------------+
              |   Frontend     |
              | React + Nginx  |
              |     :80        |
              +-------+--------+
                      |
                /api/*
                      |
                      v
              +----------------+
              |    Backend     |
              | Spring Boot    |
              |     :8080      |
              +-------+--------+
                      |
                      v
              +----------------+
              |     MySQL      |
              |      :3306     |
              +----------------+
                      |
                      v
              Persistent Volume
              procv_mysql_data
3. Frontend

Technologies :

React
Vite
Axios
React Router
Nginx

Le frontend est construit avec Vite puis servi par Nginx.

Nginx assure également le routage des requêtes /api/ vers le backend.

4. Backend

Technologies :

Java 17
Spring Boot 3.5.16
Spring Security
JWT
Spring Data JPA
MySQL
Thymeleaf
OpenHTMLtoPDF
Spring Actuator

Le backend expose les API REST et fournit notamment :

authentification ;
gestion des utilisateurs ;
gestion des CV ;
génération de documents ;
gestion des plans ;
endpoints de santé Actuator.
5. Base de données

La base utilisée est MySQL 8.4.

En production, les données sont persistées dans :

procv_mysql_data

La base n'est pas exposée directement à Internet.

6. Conteneurisation

Chaque composant applicatif possède son propre conteneur.

Le backend utilise une construction multi-stage Maven afin de séparer :

compilation ;
exécution.

Le frontend utilise également une construction multi-stage :

installation des dépendances ;
build Vite ;
serveur Nginx.

Les images sont publiées sur GitHub Container Registry.

7. CI/CD

Le pipeline GitHub Actions suit le cycle :

Code
  |
  v
Tests backend
  |
  v
Tests frontend
  |
  v
Build
  |
  v
Docker build
  |
  v
Trivy security scan
  |
  v
GHCR
  |
  v
Production

Le déploiement automatique est déclenché uniquement lors de la création d'un tag de version v*.*.*.

8. Sécurité

Les contrôles actuels comprennent notamment :

GitHub Actions ;
Gitleaks ;
Dependency Review ;
Trivy ;
images Docker minimisées ;
exécution du backend avec un utilisateur non-root ;
secrets fournis par variables d'environnement ;
backend non exposé directement sur le port public en production ;
health checks Docker ;
JWT pour l'authentification.
9. Sauvegarde

Avant chaque déploiement production, une sauvegarde MySQL est créée.

Script :

scripts/backup-production.sh

Les sauvegardes sont compressées au format :

procv_YYYYMMDD-HHMMSS.sql.gz

Une politique de rétention permet de supprimer automatiquement les anciennes sauvegardes.

10. Rollback

En cas d'échec du health check après déploiement, le système tente automatiquement de revenir à la version précédente.

Script :

scripts/rollback-production.sh

Le rollback peut également être déclenché manuellement avec :

ROLLBACK_TAG=1.0.0 ./scripts/rollback-production.sh
11. Déploiement

Le script principal est :

scripts/deploy-production.sh

Il réalise :

vérification de la configuration ;
sauvegarde de la base ;
récupération des images ;
démarrage des services ;
vérification de l'état des conteneurs ;
vérification de la santé du backend ;
rollback automatique en cas d'échec.
12. Principes d'exploitation

Les principes suivants doivent être respectés :

ne jamais versionner .env.production ;
ne jamais placer de secrets dans Git ;
effectuer une sauvegarde avant une opération critique ;
utiliser des tags de version immuables pour les releases ;
vérifier le health check après chaque déploiement ;
conserver une version précédente permettant un rollback ;
tester régulièrement la restauration des sauvegardes.
13. Évolution prévue

Les prochaines évolutions possibles comprennent :

HTTPS automatisé ;
reverse proxy de production ;
monitoring Prometheus ;
dashboards Grafana ;
logs centralisés ;
alerting ;
infrastructure as code ;
automatisation des tests de restauration ;
stratégie de disaster recovery ;
tests end-to-end ;
CodeQL ;
durcissement CSP et headers HTTP.