# Deployment steps to deploy on local machines

1. Create root level .env from .example.env
2. For each microservices, create .env from .example.env
3. In terminal, root level, run: docker compose up --build
4. You should encounter some errors regarding missing database, create the databases manually in pgadmin4. Down the docker containers then run: docker compose up.
5. Once the containers are built successfully, in terminal, root level, run: "npm run migration:run -—project={microservice_name}" , for each of the microservices, where {microservice_name} is the microservice name. IE: trade-directory
6. The repository is now ready with the tables created in the database

# Cont. Optional (Seed data in database)
1. Shut down the docker containers.
2. In root level, rename docker-compose.production.yaml -> docker-compose.yaml. Rename the original docker-compose.yaml to something else temporary
3. In terminal, root level, run: docker compose up --build
4. Once the containers are built successfully. Using Docker Desktop, navigate to the following microservices's Exec tab each:
    a. trade-directory
    b. customer-relationship-management
5. In the Docker Desktop's exec screen, navigate to the microservice's /src/scripts, then run: "node {script_name}" for all the scripts to seed the database
6. Once all the scripts are ran, change docker-compose.yaml back to docker-compose.production.yaml, change the original  docker-compose.yaml back too, then run: docker compose up --build again