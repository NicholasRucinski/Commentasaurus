package main

import (
	"log"
	"os"
	"os/exec"

	"github.com/joho/godotenv"
)

func runCommand(name string, args ...string) {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	log.Printf("Running: %s %v\n", name, args)
	if err := cmd.Run(); err != nil {
		log.Fatalf("Error running %s: %v", name, err)
	}
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or error loading it")
	}

	tag := os.Getenv("DOCKER_TAG")
	if tag == "" {
		log.Fatal("DOCKER_TAG environment variable not set")
	}

	runCommand("docker", "buildx", "build", "-t", tag, ".")

	runCommand("docker", "push", tag)

	log.Println("Build and push complete")
}
