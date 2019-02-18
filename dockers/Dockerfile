FROM debian:stable

ENV NODE_PATH=/root/node_modules

COPY meta-start.sh /usr/local/bin/

RUN /bin/bash -c '\
    apt-get update -q -y && apt-get upgrade -q -y && \
    apt-get install -y build-essential curl git vim net-tools sudo libudev-dev && \
    curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
    apt-get install -y nodejs && \
    useradd -m -p meta meta && \
    chmod +x /usr/local/bin/meta-start.sh && \
    echo "meta ALL=(ALL:ALL) NOPASSWD: ALL" >> /etc/sudoers;'

ENTRYPOINT ["/usr/local/bin/meta-start.sh"]
