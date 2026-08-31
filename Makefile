ifneq (,$(wildcard ./.env))
	include .env
	export
endif

SHELL=bash
PNPM ?= npx -y pnpm@9.4.0

help: ## Display list of tasks with descriptions
	@echo "+ $@"
	@fgrep -h ": ## " $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed 's/-default//' | awk 'BEGIN {FS = ": ## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

vendor: ## Install project dependencies
	@echo "+ $@"
	@$(PNPM) i

env: ## Create default .env file
	@echo "+ $@"
	@echo -e '# Makefile tools\nDECK_USER=deck\nDECK_HOST=\nDECK_PORT=22\nDECK_HOME=/home/deck\nDECK_KEY=~/.ssh/id_rsa' >> .env
	@echo -n "PLUGIN_FOLDER=" >> .env
	@jq -r .name package.json >> .env

init: ## Initialize project
	@$(MAKE) env
	@$(MAKE) vendor
	@echo -e "\n\033[1;36m Almost ready! Just a few things left to do:\033[0m\n"
	@echo -e "1. Open .env file and make sure every DECK_* variable matches your steamdeck's ip/host, user, etc"
	@echo -e "2. Run \`\033[0;36mmake copy-ssh-key\033[0m\` to copy your public ssh key to steamdeck"
	@echo -e "3. Build your code with \`\033[0;36mmake build\033[0m\` or \`\033[0;36mmake docker-build\033[0m\` to build inside a docker container"
	@echo -e "4. Deploy your plugin code to steamdeck with \`\033[0;36mmake deploy\033[0m\`"

update-decky-dependencies: ## Update Decky SDK dependencies
	@echo "+ $@"
	@$(PNPM) update @decky/api @decky/rollup @decky/ui --latest

build-front: ## Build frontend
	@echo "+ $@"
	@$(PNPM) run build

build: ## Build everything
	@$(MAKE) build-front

copy-ssh-key: ## Copy public ssh key to steamdeck
	@echo "+ $@"
	@ssh-copy-id -i $(DECK_KEY) $(DECK_USER)@$(DECK_HOST)

deploy-steamdeck: ## Deploy plugin build to steamdeck
	@echo "+ $@"
	@ssh $(DECK_USER)@$(DECK_HOST) -p $(DECK_PORT) -i $(DECK_KEY) \
		'sudo -n mkdir -p $(DECK_HOME)/homebrew/plugins/$(PLUGIN_FOLDER)'
	@rsync -azp --delete --delete-excluded --progress -e "ssh -p $(DECK_PORT) -i $(DECK_KEY)" \
		--rsync-path="sudo -n rsync" \
		--chmod=Du=rwx,Dg=rx,Do=rx,Fu=rwx,Fg=rx,Fo=rx \
		--exclude='.git/' \
		--exclude='.github/' \
		--exclude='.vscode/' \
		--exclude='node_modules/' \
		--exclude='.pnpm-store/' \
		--exclude='src/' \
		--exclude='screenshots/' \
		--exclude='pnpm-lock.yaml' \
		--exclude='rollup.config.js' \
		--exclude='tsconfig.json' \
		--exclude='*.pyi' \
		--exclude='*.map' \
		--exclude='*.log' \
		--exclude='__pycache__/' \
		--exclude='*.pyc' \
		--exclude='.gitignore' \
		--exclude='.idea/' \
		--exclude='.env' \
		--exclude='Makefile' \
 		./ $(DECK_USER)@$(DECK_HOST):$(DECK_HOME)/homebrew/plugins/$(PLUGIN_FOLDER)/
	@ssh $(DECK_USER)@$(DECK_HOST) -p $(DECK_PORT) -i $(DECK_KEY) \
		'sudo -n chown -R root:root $(DECK_HOME)/homebrew/plugins/$(PLUGIN_FOLDER)'

restart-decky: ## Restart Decky on remote steamdeck
	@echo "+ $@"
	@ssh $(DECK_USER)@$(DECK_HOST) -p $(DECK_PORT) -i $(DECK_KEY) \
		'sudo -n systemctl restart plugin_loader.service'
	@echo -e '\033[0;32m+ all is good, restarting Decky...\033[0m'

deploy: ## Deploy code to steamdeck and restart Decky
	@$(MAKE) deploy-steamdeck
	@$(MAKE) restart-decky

it: ## Build all code, deploy it to steamdeck, restart Decky
	@$(MAKE) build deploy

cleanup: ## Delete all generated files and folders
	@echo "+ $@"
	@rm -f .env
	@rm -rf ./dist
	@rm -rf ./tmp
	@rm -rf ./node_modules
	@rm -rf ./.pnpm-store
	@rm -rf ./backend/out

uninstall-plugin: ## Uninstall plugin from steamdeck, restart Decky
	@echo "+ $@"
	@ssh -t $(DECK_USER)@$(DECK_HOST) -p $(DECK_PORT) -i $(DECK_KEY) \
 		"sudo sh -c 'rm -rf $(DECK_HOME)/homebrew/plugins/$(PLUGIN_FOLDER)/ && systemctl restart plugin_loader.service'"
	@echo -e '\033[0;32m+ all is good, restarting Decky...\033[0m'

docker-rebuild-image: ## Rebuild docker image
	@echo "+ $@"
	@docker compose build --pull

docker-build: ## Build project inside docker container
	@echo "+ $@"
	@docker run --rm -i -v $(PWD):/plugin -v $(PWD)/tmp/out:/out ghcr.io/steamdeckhomebrew/builder:latest
