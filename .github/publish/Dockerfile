FROM alpine/git:latest

LABEL "com.github.actions.icon"="upload-cloud"
LABEL "com.github.actions.color"="blue"

ADD entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
