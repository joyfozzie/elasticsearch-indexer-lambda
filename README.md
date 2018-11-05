# Configuring Kibana

After the es-uploader-lambda has bootstrapped the lab by indexing a set of data from (s3|aurora) to elasticsearch, Kibana needs to be configured using the following steps:
1. Modify ES access policy to give yourself access
1. Create an index pattern. Kibana uses index patterns to retrieve data from Elasticsearch indices for things like visualizations. Since we want to visualize our results on a Coordinate Map, we need an index pattern. To create one:
    * From the Kibana Dashboard, go to the `Management` tab and then choose `Index Patterns`
    * For Step 1 of 2: Define index pattern, specify `logstash*` as the index pattern and then click `Next Step`
    * For Step 2 of 2: Configure settings, select `@timestamp` from the drop down and then click `Create Index Pattern`
1. Enable the tile map. [Due to licensing restrictions, the default installation of Kibana on Amazon ES domains that use Elasticsearch 5.x or greater does not include a map server for tile map visualizations](https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/es-kibana.html#es-kibana-map-server). 
    * From the Kibana Dashboard, go to the `Management` tab and then choose `Advanced Settings`
    * Scroll down to the `visualization:tileMap:WMSdefaults` and click the `edit` button
    * Replace the json configuration object with the following json object and click 'Save`
    ```
    {
        "enabled": true,
        "options": {
            "format": "image/png",
            "transparent": true,
            "url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "layers": "0"
        }
    }
    ```
    * Now Kibana has to be reloaded. To do this, close out of the Kibana web page and then re-open by navigating back to the Elasticsearch Domain console and clicking the Kibana link
1. Create a Coordinate Map visualization
    * From the Kibana Dashboard, go to the `Visualize` tab and then choose `Create a Visualization`
    * Choose `Coordinate Map` as the type
    * In the `From a New Search, Select Index` section, select the `logstash*` index pattern we created in step 1
    * Under the `Buckets ... Select buckets type` section click `Geo Coordinates`
    * Select `Geohash` for the Aggregation
    * Select `geo.coordinates` for the field
    * Change the `Time Range` by clicking the tool in the upper-right portion of the web page, and then from the `Quick` tab select `Last 5 years`
    * You should now see the coordinate map populated with geocoordinates on the map from the indexed data in elasticsearch

# CloudFormation

Both the Aurora lab and the Elasticsearch lab use CloudFormation. To create the resources for the labs, first copy the local files under the `/cfn` folder to a bucket in S3 using the cli command: `$ aws s3 sync cfn s3://<your_bucket_name>`. The zip'd lambda function code is also under the `/cfn` directory and will be uploaded to S3 bucket when this command is executed.
* The `aurora-lab.yaml` CloudFormation template creates a VPC with 3 public subnets and a security group rule that allows all ingress/egress traffic. It then creates a public Aurora Postgres RDS cluster/instance running inside the new VPC. To create the stack run the following command:

```
aws cloudformation create-stack --region <your_aws_region> --stack-name aurora-lab --template-url https://s3.amazonaws.com/<your_bucket_name>/aurora-lab.yaml --parameters ParameterKey=DbUsername,ParameterValue=<your_db_username> ParameterKey=DbPassword,ParameterValue=<your_db_password>
```
* The `elastic-search.yaml` CloudFormation template creates an Elasticsearch Domain and a Lambda function with the code contained in this repository. The Lambda function pulls data from S3 and streams it into an Elasticsearch index. The sample data is located under `/data/logs.json`. Upload `logs.json` to a S3 and then when you create stack the S3 bucket and logs.json will be specified to allow Lambda to read it. To kick-off the index job, go to the Lambda console for the newly created function, create a new empty `Test Event` and then click the `Test` button. To create the stack run the following command:

```
aws cloudformation create-stack --region <your_aws_region> --stack-name elasticsearch-lab --template-url https://s3.amazonaws.com/<your_bucket_name>/elasticsearch-lab.yaml --capabilities CAPABILITY_IAM --parameters ParameterKey=CodeBucket,ParameterValue=<your_bucket_name> ParameterKey=S3LogDataBucket,ParameterValue=<the_s3_bucket_where_logs.json_was_uploaded> ParameterKey=S3LogDataKey,ParameterValue=logs.json
```

* **Important** When making local changes to the CloudFormation templates, make sure to run the `aws s3 sync` command before creating a new stack to ensure that the latest version is in S3