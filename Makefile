MODULE ?=

.PHONY: list install build test ci test-all help

help:
	@echo "Usage:"
	@echo "  make list"
	@echo "  make install MODULE=xq-common-kit"
	@echo "  make build MODULE=xq-common-kit"
	@echo "  make test MODULE=xq-common-kit"
	@echo "  make ci MODULE=xq-common-kit"
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
