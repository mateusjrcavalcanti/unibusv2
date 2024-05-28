FROM ubuntu:16.04 as base

FROM base as csdtk
# Instalação de dependências
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -qq 
RUN apt-get install -yq \
    unzip \
    wget 
# DIRETÓRIO TEMPORÁRIO
RUN mkdir /home/root -p
WORKDIR /home/root
# DOWNLOAD DO CSDTK
RUN wget https://github.com/mateusjrcavalcanti/GPRS_C_SDK/releases/download/v2.129/CSDTK42_Linux.tar.gz
RUN tar -xzf CSDTK42_Linux.tar.gz
RUN rm CSDTK42_Linux.tar.gz
# LIMPEZA DO SISTEMA
RUN apt-get autoremove -y --purge
RUN apt-get clean -y
RUN rm -rf /var/lib/apt/lists/* 
RUN rm -rf /tmp 

FROM base as gprs_c_sdk
# Instalação de dependências
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -qq 
RUN apt-get install -yq \
    git
# DIRETÓRIO TEMPORÁRIO
RUN mkdir /home/root
WORKDIR /home/root
# DOWNLOAD DO GPRS_C_SDK
RUN git clone https://github.com/mateusjrcavalcanti/GPRS_C_SDK.git /home/root/GPRS_C_SDK --recursive
RUN chmod +x /home/root/GPRS_C_SDK/build.sh 
RUN chmod +x /home/root/GPRS_C_SDK/platform/compilation/elfCombine.pl
# LIMPEZA DO SISTEMA
RUN apt-get autoremove -y --purge
RUN apt-get clean -y
RUN rm -rf /var/lib/apt/lists/* 
RUN rm -rf /tmp 

FROM base as deps
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -qq 
RUN apt-get install -yq \
    build-essential \
    git \
    gcc-multilib \
    g++-multilib \
    lib32z1 \
    python 
# GPRS Burn and Debug
RUN apt-get install -yq \
    libqt4-qt3support \
    itcl3 \
    itk3 \
    iwidgets4 
# Watch project folder for build
RUN apt-get install -yq \
    inotify-tools

FROM deps as users
ARG UID=1000
ARG GID=1000
# Adiciona o grupo a9g
RUN addgroup --gid $GID a9g
# Adiciona o usuário a9g e o coloca no grupo a9g com UID e GID definidos
RUN adduser --uid $UID --gid $GID --disabled-password --gecos "" a9g
# Adiciona o usuário a9g ao grupo dialout
RUN usermod -a -G dialout a9g
# Adiciona o usuário a9g ao grupo sem solicitar senha
RUN echo "a9g ALL=(ALL) NOPASSWD:ALL" | tee -a /etc/sudoers > /dev/null

FROM users as build

ARG UID=1000
ARG GID=1000
# Define o diretório de trabalho
WORKDIR /home/a9g
# Adiciona o script de entrada
COPY a9g.sh start.sh
RUN chmod +x start.sh
# Define o usuário a9g como usuário padrão
USER $UID:$GID
# Define o shell padrão
RUN touch ~/.profile
# Download do CSDTK42
COPY --from=csdtk --chown=$UID:$GID /home/root/CSDTK /home/a9g/CSDTK
# Download do GPRS_C_SDK
COPY --from=gprs_c_sdk --chown=$UID:$GID /home/root/GPRS_C_SDK /home/a9g/GPRS_C_SDK
# Executa script de setup
RUN cd ~/CSDTK \
    && ./setup.sh ./ ~/