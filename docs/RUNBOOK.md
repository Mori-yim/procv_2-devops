# ProCV — Runbook opérationnel

## 1. Objectif

Ce document fournit les procédures rapides permettant d'exploiter ProCV, diagnostiquer un incident et rétablir le service.

## 2. Vérifier l'état global

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
Les services attendus sont :

db : healthy
backend : healthy
frontend : running
3. Vérifier le backend
docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  exec -T backend \
  /busybox wget -q -O - \
  http://127.0.0.1:8080/actuator/health

Résultat attendu :

{
  "status": "UP"
}
4. Consulter les logs

Backend :

docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200 backend

Frontend :

docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200 frontend

Base de données :

docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200 db
5. Backend non disponible

Vérifier :

docker compose --env-file .env.production -f docker-compose.prod.yml ps backend

Puis :

docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=300 backend

Vérifier notamment :

connexion MySQL ;
variables DB ;
JWT_SECRET ;
erreurs Spring Boot ;
port 8080 ;
état du conteneur.

Si le backend ne récupère pas un état sain après un nouveau déploiement, le script de déploiement tente automatiquement un rollback.

6. Base de données non disponible

Vérifier :

docker compose --env-file .env.production -f docker-compose.prod.yml ps db

Puis :

docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=300 db

Ne jamais supprimer le volume MySQL sans procédure de récupération validée.

Le volume de production est :

procv_mysql_data
7. Frontend non disponible

Vérifier :

docker compose --env-file .env.production -f docker-compose.prod.yml ps frontend

Puis :

docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=300 frontend

Vérifier également :

Nginx ;
configuration /api/ ;
résolution du backend ;
port HTTP/HTTPS ;
reverse proxy externe.
8. Déploiement standard

Toujours privilégier :

./scripts/deploy-production.sh

Ce script :

crée une sauvegarde ;
récupère les images ;
démarre la nouvelle version ;
attend le health check ;
déclenche un rollback si nécessaire.
9. Rollback manuel

Pour revenir à une version connue :

ROLLBACK_TAG=1.0.0 ./scripts/rollback-production.sh

Puis vérifier :

docker compose --env-file .env.production -f docker-compose.prod.yml ps

et :

docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  exec -T backend \
  /busybox wget -q -O - \
  http://127.0.0.1:8080/actuator/health
10. Sauvegarde manuelle

Créer une sauvegarde :

./scripts/backup-production.sh

Lister les sauvegardes :

ls -lh ./backups/mysql

Une sauvegarde valide doit être non vide et porter l'extension :

.sql.gz
11. Vérifier l'espace disque
df -h

Puis :

docker system df

Ne supprimer aucune ressource Docker de production sans vérifier son impact.

12. Incident après release

Si une nouvelle version provoque une panne :

identifier la version déployée ;
consulter les logs backend ;
vérifier Actuator ;
identifier la dernière version stable ;
effectuer un rollback ;
vérifier le service ;
conserver les logs de l'incident ;
créer un ticket de correction.
13. Incident de données

Si les données sont corrompues :

arrêter les opérations applicatives ;
identifier la dernière sauvegarde valide ;
conserver une copie de la sauvegarde actuelle ;
valider la sauvegarde à restaurer ;
restaurer les données ;
redémarrer les services ;
vérifier le health check ;
vérifier les données critiques.

Une restauration de données est une opération critique.

14. Vérification post-incident

Après résolution :

frontend accessible ;
backend healthy ;
base de données healthy ;
authentification fonctionnelle ;
création/consultation d'un CV fonctionnelle ;
logs sans erreur critique ;
espace disque suffisant ;
sauvegarde récente disponible.
15. Sécurité opérationnelle

Ne jamais afficher ou transmettre :

JWT_SECRET ;
mots de passe MySQL ;
clés SSH privées ;
tokens GitHub ;
fichiers .env.production.

En cas de fuite d'un secret :

considérer le secret comme compromis ;
le révoquer ;
générer une nouvelle valeur ;
mettre à jour la configuration ;
redéployer ;
vérifier les logs ;
documenter l'incident.
16. Checklist avant release
[ ] Tests backend OK
[ ] Tests frontend OK
[ ] Build frontend OK
[ ] Docker build OK
[ ] Trivy OK
[ ] Images publiées dans GHCR
[ ] Version Git taguée
[ ] Backup disponible
[ ] Configuration production vérifiée
[ ] Health check OK
[ ] Rollback possible
17. Checklist après release
[ ] Containers running
[ ] Database healthy
[ ] Backend healthy
[ ] Frontend accessible
[ ] Authentication functional
[ ] CV creation functional
[ ] Logs checked
[ ] Backup verified
18. Principe d'escalade

Si un incident ne peut pas être résolu rapidement :

ne pas effectuer de modification destructive ;
conserver les logs ;
conserver les sauvegardes ;
revenir à la dernière version stable si nécessaire ;
documenter les symptômes ;
analyser la cause racine après rétablissement du service.