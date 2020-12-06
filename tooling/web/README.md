# Web ui for Workflow

This is a API and a React Web ui that can be used to manage Processors. 
In the web UI you can create and connect processors and manage the data flow.

Web contains 4 directories.  
The first one is envoy. This is a proxy configuration for envoy so that we can use grpc inside the browser. This is needed since most browsers does not yet support HTTP2.0.  
The dockerfile takes in 3 arguments  
ARG envoyconfig = The path to the configuration file to insert  
ARG api_port = The Port of the hosted GRPC API  
ARG ui_port = The port where to Proxy the API, this is the port that the JS client will connect to  

The second is Proto, this directory contains the proto specs.  
Proto is build for both the Golang Server API and the Javascript client.

The third is the ui which is the react app.  

The forth is the API.