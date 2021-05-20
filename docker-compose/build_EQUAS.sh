rm -rf EQUAS
cd ..
cd EQUAS/
./gradlew clean
./gradlew bootWar -Pprod buildDocker
cp -R build/docker/ ../docker-compose/EQUAS

