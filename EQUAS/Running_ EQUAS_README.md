# Steps for running EQUAS

## Set up the MongoDB environment

### 1. Install [MongoDB](https://www.mongodb.com/download-center?#community) (Community Server Edition)

### 2. Run MongoDB
MongoDB requires a data directory to store all data. MongoDB’s default data directory path is the absolute path \data\db on the drive from which you start MongoDB. Create this folder by running the following command in a Command Prompt:

    md \data\db

You can specify an alternate path for data files using the --dbpath option to mongod.exe, for example:    

    "C:\Program Files\MongoDB\Server\3.6\bin\mongod.exe" --dbpath "d:\test\mongo db data"


## Set up VQA Server
1. TODO

## Running EQUAS from the executable WAR file

1. Ensure MongoDB is up and running.
2. To run EQUAS you will need to specify your image directory path as well as the ip address/port of the VQA server.  Below is an example command to demonstrate usage.

<span style="color:GoldenRod">
Warning: Be sure to use forward slashes when specifying the image directory path.  You must also include the final slash at the end of the file path.
</span>

```
java -jar xai-0.0.1-SNAPSHOT.war --application.vqa-server.host-address=128.89.77.64 --application.vqa-server.port=8088  --application.evaluation.dataset-root-path="D:/XAI/evaluation_dataset/"
```

After a few seconds of initialization you should see the following in the console.
```
----------------------------------------------------------
        Application 'XAI' is running! Access URLs:
        Local:          http://localhost:8087
        External:       http://128.89.77.64:8087
        VQA Server:     128.89.77.64:8088
        Dataset Path:   D:\XAI\evaluation_dataset
        Profile(s):     [swagger, dev]
----------------------------------------------------------
```
You are now able to use EQUAS by navigating to the **External** url in your web browser.  You should see the EQUAS landing page with a prompt to sign in.  Login with the username/password of user/user.


