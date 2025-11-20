MAIN_GO_FILE := ./cmd/server/main.go
DEPLOY_GO_FILE := ./cmd/deploy/main.go

SWAGGER_DOCS_DIR := docs

.PHONY: run deploy docs clean install-tools help

help:
	@echo "Makefile for Deployment and Swagger Generation"
	@echo ""
	@echo "Usage:"
	@echo "  make run"
	@echo "  make deploy"
	@echo "  make install-tools    Install air, godoc, and swag CLI tools."
	@echo "  make docs Generates Markdown docs and Swagger (OpenAPI) JSON/YAML definitions in the $(SWAGGER_DOCS_DIR) directory."
	@echo "  make clean            Removes generated Swagger files."
	@echo "  make all              Runs generate-swagger and serve-godoc."
	@echo ""

run:
	go run $(MAIN_GO_FILE)

deploy:
	go run $(DEPLOY_GO_FILE)

install-tools:
	@echo "Installing gomarkdoc (github.com/princjef/gomarkdoc/cmd/gomarkdoc@latest)..."
	go install github.com/princjef/gomarkdoc/cmd/gomarkdoc@latest	
	@echo "Installing swag (github.com/swaggo/swag/cmd/swag)..."
	go install github.com/swaggo/swag/cmd/swag@latest
	@echo "Installing air (github.com/air-verse/air)"
	go install github.com/air-verse/air@latest
	@echo "Tools installed successfully."

docs:
	@$(MAKE) clean
	@echo "Generating Markdown"
	gomarkdoc --output './docs/{{.Dir}}.md' ./internal/...
	@echo "Generating Swagger (OpenAPI) definitions..."
	swag init -g $(MAIN_GO_FILE)
	@echo "Swagger definitions generated in the $(SWAGGER_DOCS_DIR) directory."

clean:
	@echo "Cleaning up generated Swagger documentation..."
	@rm -rf $(SWAGGER_DOCS_DIR)
	@echo "Clean complete."
