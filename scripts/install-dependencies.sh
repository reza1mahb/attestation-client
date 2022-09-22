bash ./scripts/install-config.sh

echo -e "${GREENBOLD}Installing Attestation Suite dependencies${NC}"

echo -e "${REDBOLD}[1] ${GREENBOLD}Installing ${REDBOLD}nvm${NC}"
# node
sudo apt-get update
sudo apt install curl -y
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash

source ~/.profile 
source ~/.nvm/nvm.sh
nvm install 14.15.4
nvm alias default 14.15.4
nvm use 14.15.4

# set sudo node to the same version
n=$(which node); \
n=${n%/bin/node}; \
chmod -R 755 $n/bin/*; \
sudo cp -r $n/{bin,lib,share} /usr/local

# yarn
echo -e "${REDBOLD}[2] ${GREENBOLD}Installing ${REDBOLD}yarn${NC}"
sudo apt install npm -y
sudo npm install --global yarn -y

source ~/.profile 

