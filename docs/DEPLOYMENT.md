# ProCV — Guide de déploiement

## 1. Prérequis

Pour un environnement de production :

- serveur Linux ;
- Docker ;
- Docker Compose ;
- accès réseau HTTPS ;
- nom de domaine ;
- accès aux images GitHub Container Registry ;
- accès SSH sécurisé.

## 2. Configuration

Créer le fichier :

```text
.env.production
à partir du modèle :

deploy/.env.production.example

Exemple :

cp deploy/.env.production.example .env.production

Les valeurs suivantes doivent être configurées :

IMAGE_TAG
BACKEND_IMAGE
FRONTEND_IMAGE
HTTP_PORT
APP_ALLOWED_ORIGINS
MYSQL_DATABASE
MYSQL_USER
MYSQL_PASSWORD
MYSQL_ROOT_PASSWORD
JWT_SECRET
JWT_EXPIRATION_MS

Le fichier .env.production ne doit jamais être commité.

3. Génération des secrets

Le secret JWT doit être suffisamment long et aléatoire.

Exemple :

openssl rand -base64 48

Les mots de passe MySQL doivent également être générés avec une valeur forte et unique.

4. Vérification de la configuration

Avant le déploiement :

docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  config

Cette commande permet de détecter les erreurs de configuration Compose.

5. Déploiement manuel

Le déploiement standard utilise :

./scripts/deploy-production.sh

Le script effectue automatiquement :

vérification de .env.production ;
vérification des scripts nécessaires ;
sauvegarde MySQL ;
récupération des images ;
démarrage des conteneurs ;
vérification de l'état des services ;
vérification du health check backend ;
rollback automatique en cas d'échec.
6. Vérification après déploiement

Vérifier :

docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  ps

Puis :

docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  exec -T backend \
  /busybox wget -q -O - \
  http://127.0.0.1:8080/actuator/health

Le résultat attendu contient :

{
  "status": "UP"
}
7. Sauvegarde

Une sauvegarde peut être exécutée manuellement :

./scripts/backup-production.sh

Les fichiers sont stockés par défaut dans :

./backups/mysql

Pour modifier la rétention :

RETENTION_DAYS=14 ./scripts/backup-production.sh
8. Rollback manuel

Pour revenir à une version connue :

ROLLBACK_TAG=1.0.0 ./scripts/rollback-production.sh

Exemple :

ROLLBACK_TAG=1.0.0 ./scripts/rollback-production.sh

Après le rollback, vérifier obligatoirement :

docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  ps

et le health check Actuator.

9. Déploiement via GitHub Actions

Le pipeline CI/CD réalise :

Commit
   |
   v
Backend tests
   |
   v
Frontend tests
   |
   v
Frontend build
   |
   v
Docker build
   |
   v
Trivy scan
   |
   v
GitHub Container Registry
   |
   v
Production

Le déploiement automatique de production est associé aux tags :

v1.0.0
v1.1.0
v2.0.0
10. Versionnement

Une release doit utiliser une version explicite.

Exemple :

git tag v1.0.0
git push origin v1.0.0

Le pipeline utilise alors cette version comme IMAGE_TAG.

Cela permet de conserver plusieurs versions des images et facilite le rollback.

11. GitHub Environment

Le workflow de production utilise l'environnement :

production

Les secrets suivants doivent être configurés dans GitHub :

PRODUCTION_HOST
PRODUCTION_USER
PRODUCTION_SSH_KEY
PRODUCTION_PATH

Ils ne doivent jamais être écrits directement dans le workflow.

12. GitHub Container Registry

Les images sont publiées sous :

ghcr.io/mori-yim/procv_2-devops/backend
ghcr.io/mori-yim/procv_2-devops/frontend

Exemple de tags :

backend:1.0.0
backend:latest

frontend:1.0.0
frontend:latest

En production, il est recommandé d'utiliser une version explicite plutôt que latest.

13. HTTPS et domaine

Le fichier docker-compose.prod.yml expose le frontend sur le port HTTP configuré.

Pour une vraie production Internet, HTTPS doit être fourni par un reverse proxy ou une infrastructure équivalente.

Architecture recommandée :

Internet
   |
   v
HTTPS / 443
   |
   v
Reverse Proxy
   |
   v
ProCV Frontend
   |
   v
ProCV Backend

Le certificat TLS doit être renouvelé automatiquement.

14. Pare-feu

Le serveur de production doit limiter les ports accessibles publiquement.

Typiquement :

22   SSH
80   HTTP
443  HTTPS

MySQL 3306 et Spring Boot 8080 ne doivent pas être exposés publiquement.

15. Maintenance

Commandes utiles :

docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  ps

Logs backend :

docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  logs --tail=200 backend

Logs frontend :

docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  logs --tail=200 frontend

Logs base de données :

docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  logs --tail=200 db
16. Procédure en cas d'incident

En cas de problème :

vérifier l'état des conteneurs ;
vérifier les logs ;
vérifier le health check ;
vérifier l'espace disque ;
vérifier la connectivité réseau ;
vérifier la version actuellement déployée ;
effectuer un rollback si nécessaire ;
restaurer une sauvegarde si les données sont affectées.
17. Restauration d'une sauvegarde

Une restauration doit être effectuée avec prudence et idéalement après arrêt des services applicatifs.

Exemple général :

gunzip -c backups/mysql/procv_YYYYMMDD-HHMMSS.sql.gz \
  | docker compose \
      --env-file .env.production \
      -f docker-compose.prod.yml \
      exec -T db \
      sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'

Une sauvegarde récente doit être conservée avant toute restauration destructive.

18. Règles critiques

Ne jamais :

commiter .env.production ;
publier un JWT secret ;
exposer MySQL sur Internet ;
exposer directement le backend sur Internet ;
supprimer toutes les anciennes images avant validation ;
supprimer toutes les sauvegardes avant validation ;
déployer une version non testée en production.

Toujours :

tester avant release ;
sauvegarder avant déploiement ;
utiliser des versions ;
vérifier le health check ;
conserver une possibilité de rollback ;
documenter les incidents.