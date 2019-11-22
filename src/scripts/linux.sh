tick="✓"
cross="✗"

step_log() {
  message=$1
  printf "\n\033[90;1m==> \033[0m\033[37;1m%s\033[0m\n" "$message"
}

add_log() {
  mark=$1
  subject=$2
  message=$3
  if [ "$mark" = "$tick" ]; then
    printf "\033[32;1m%s \033[0m\033[34;1m%s \033[0m\033[90;1m%s\033[0m\n" "$mark" "$subject" "$message"
  else
    printf "\033[31;1m%s \033[0m\033[34;1m%s \033[0m\033[90;1m%s\033[0m\n" "$mark" "$subject" "$message"
  fi
}
existing_version=$(php-config --version | cut -c 1-3)
version=$1
status="Switched to PHP$version"
step_log "Setup PHP and Composer"
find /etc/apt/sources.list.d -type f -name 'ondrej-ubuntu-php*.list' -exec sudo DEBIAN_FRONTEND=noninteractive apt-fast update -o Dir::Etc::sourcelist="{}" ';' 
if [ "$existing_version" != "$1" ]; then
	if [ ! -e "/usr/bin/php$1" ]; then
		if [ "$1" != "7.4" ]; then
		  sudo DEBIAN_FRONTEND=noninteractive apt-fast install -y php"$1" curl php"$1"-curl 
		else
		  sudo DEBIAN_FRONTEND=noninteractive apt-fast install -y php"$1" php"$1"-dev php"$1"-xml curl php"$1"-curl 
		fi
		status="Installed PHP$version"
	fi

	for tool in php phar phar.phar php-cgi php-config phpize; do
		if [ -e "/usr/bin/$tool$1" ]; then
			sudo update-alternatives --set $tool /usr/bin/"$tool$1" 
		fi
	done
fi

ini_file=$(php --ini | grep "Loaded Configuration" | sed -e "s|.*:s*||" | sed "s/ //g")
ext_dir=$(php -i | grep "extension_dir => /usr" | sed -e "s|.*=> s*||")
sudo chmod 777 "$ini_file"
sudo mkdir -p /run/php
add_log "$tick" "PHP" "$status"
if [ "$2" = "true" ]; then
  if [ "$1" != "7.4" ]; then
    sudo DEBIAN_FRONTEND=noninteractive apt-fast install -y php"$1"-dev php"$1"-xml 
  fi
  sudo update-alternatives --set php-config /usr/bin/php-config"$1" 
  sudo update-alternatives --set phpize /usr/bin/phpize"$1" 
  wget https://github.com/pear/pearweb_phars/raw/master/install-pear-nozlib.phar 
  sudo php install-pear-nozlib.phar 
  sudo pear config-set php_ini "$ini_file" 
  add_log "$tick" "PECL" "Installed"
fi

if [ ! -e "/usr/bin/composer" ]; then
	curl -s -L https://getcomposer.org/installer > composer-setup.php
	if [ "$(curl -s https://composer.github.io/installer.sig)" != "$(php -r "echo hash_file('sha384', 'composer-setup.php');")" ]; then
		>&2 echo 'ERROR: Invalid installer signature'		
	else
		export COMPOSER_ALLOW_SUPERUSER=1
		sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
	fi
	rm composer-setup.php	
fi
composer global require hirak/prestissimo 
add_log "$tick" "Composer" "Installed"

add_extension()
{
  extension=$1
  install_command=$2
  prefix=$3
  if ! php -m | grep -i -q "$extension" && [ -e "$ext_dir/$extension.so" ]; then
    echo "$prefix=$extension" >> "$ini_file" && add_log "$tick" "$extension" "Enabled"
  elif php -m | grep -i -q "$extension"; then
    add_log "$tick" "$extension" "Enabled"
  elif ! php -m | grep -i -q "$extension"; then
      (
        eval "$install_command" && \
        add_log "$tick" "$extension" "Installed and enabled"
      ) || add_log "$cross" "$extension" "Could not install $extension on php$version"
  fi
}