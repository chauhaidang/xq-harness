MODULE ?=

.PHONY: list install build test ci test-all help

help:
	@echo "Usage:"
	@echo "  make list"
	@echo "  make install MODULE=node-example"
	@echo "  make build MODULE=node-example"
	@echo "  make test MODULE=node-example"
	@echo "  make ci MODULE=node-example"
	@echo "  make test-all"

list:
	@./scripts/module list

install:
	@test -n "$(MODULE)" || (echo "usage: make install MODULE=<name>" && exit 1)
	@./scripts/module install $(MODULE)

build:
	@test -n "$(MODULE)" || (echo "usage: make build MODULE=<name>" && exit 1)
	@./scripts/module build $(MODULE)

test:
	@test -n "$(MODULE)" || (echo "usage: make test MODULE=<name>" && exit 1)
	@./scripts/module test $(MODULE)

ci:
	@test -n "$(MODULE)" || (echo "usage: make ci MODULE=<name>" && exit 1)
	@./scripts/module ci $(MODULE)

test-all:
	@./scripts/module test-all
