#!/bin/bash

###############GPRS CSDTK#############
alias work='source /home/a9g/CSDTK/cygenv.sh'
export GPRS_PROJ_ROOT=/home/a9g
export PATH=$PATH:/home/a9g/CSDTK/bin:/home/a9g/CSDTK/mingw32/usr/bin:/home/a9g/CSDTK/mips-rda-elf/bin:/home/a9g/CSDTK/rv32-elf/bin
export PATH=$PATH:/home/a9g/CSDTK/cooltools
export LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/home/a9g/CSDTK/lib:/home/a9g/CSDTK/mingw32/usr/lib
############GPRS CSDTK END############

# Cria o diretório ~/include/ se ele não existir
mkdir -p /home/a9g/include/
mkdir -p /home/a9g/libs/

# Copia o conteúdo de ~/GPRS_C_SDK/include/ para ~/include/
cp -r /home/a9g/GPRS_C_SDK/include/* /home/a9g/include/
# Copia o conteúdo de ~/GPRS_C_SDK/libs/ para ~/libs/
cp -r /home/a9g/GPRS_C_SDK/libs/* /home/a9g/libs/

# Verifica se a variável de ambiente "demo" está definida e não está vazia
if [ -n "$demo" ] && [ -n "$(echo "$demo" | tr -d '[:space:]')" ]; then
    cd /home/a9g/GPRS_C_SDK
    while true; do
        rm -rf ./hex/$demo
        ./build.sh demo "$demo"
        inotifywait -r -e modify,create,delete,move "./demo"  
    done
else
    cd /home/a9g/GPRS_C_SDK
     while true; do
        rm -rf ./hex/unibus
        ./build.sh unibus
        inotifywait -r -e modify,create,delete,move "./unibus"  
    done
fi

bash