FROM envoyproxy/envoy:v1.12.2

ARG envoyconfig
ARG api_port
ARG ui_port

RUN mkdir /certs

COPY ${envoyconfig} /etc/envoy/envoy.yaml

RUN sed -i "s/APIPORT/${api_port}/" /etc/envoy/envoy.yaml
RUN sed -i "s/UIPORT/${ui_port}/" /etc/envoy/envoy.yaml

RUN cat /etc/envoy/envoy.yaml

COPY ca.cert /certs/ca.cert
COPY server.key /certs/server.key
COPY server.pem /certs/server.pem
CMD /usr/local/bin/envoy -c /etc/envoy/envoy.yaml