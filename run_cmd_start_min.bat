REM Start up base docker containters (Mongo and Registry)
cd docker-compose
start docker-compose -f docker-compose-EQUAS-dev-test-min.yml up --build

REM Give Docker time to startup
timeout 15

REM Start AMT gateway
cd..
cd EQUAS
start "EQUAS GATEWAY" gradlew bootRun
REM Serve up UI in dev mode
start "EQUAS npm" cmd /c "yarn start"
