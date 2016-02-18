HOMEDIR = $(shell pwd)

pushall: sync
	git push origin master

sync:
	rsync -a $(HOMEDIR) $(SMUSER)@sprigot-droplet:/var/www/
