REM Start up base docker containters (Mongo, Fuseki, Registry)
cd docker-compose
start docker-compose -f docker-compose-EQUAS-dev-test.yml up --build

REM Give Docker time to startup
timeout 15

REM Start AMT gateway
cd..
cd EQUAS
start "EQUAS GATEWAY" gradlew bootRun
start "EQUAS npm" cmd /c "yarn start"
