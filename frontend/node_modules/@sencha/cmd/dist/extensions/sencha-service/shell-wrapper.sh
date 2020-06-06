#!/bin/sh

# cache the current directory, as loading the following scripts
# may change it
currPwd=$(pwd);

if [ -e /etc/profile ]
then
    source /etc/profile;
fi

if [ -e /etc/bash.bashrc ]
then
    source /etc/bash.bashrc;
fi

if [ -e ~/.bashrc ]
then
    source ~/.bashrc;
fi

if [ -e ~/.bash_profile ]
then
    source ~/.bash_profile;
fi

if [ -e ~/.bash_login ]
then
    source ~/.bash_login;
fi

if [ -e ~/.profile ]
then
    source ~/.profile;
fi

# re-apply the original working directory
cd $currPwd;

# now run the passed command
"$@"