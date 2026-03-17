pipeline {
    agent any

    environment {
        // Set your Docker Hub username and image name (or override via Jenkins job parameters)
        DOCKERHUB_CREDENTIALS = "${DOCKERHUB_CREDENTIALS}"
        DOCKERHUB_USERNAME = 'minkhant16999'
        IMAGE_NAME = 'demo'
        KUBE_CONFIG = '/root/.kube/config'
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Log Start') {
            steps {
                echo "=========================================="
                sh 'echo "Pipeline started at: $(date \'+%Y-%m-%d %H:%M:%S\')"'
                echo "Build: #${env.BUILD_NUMBER} | Job: ${env.JOB_NAME}"
                echo "=========================================="
            }
        }

        stage('Checkout') {
            steps {
                echo "Cloning repo from SCM (job-configured repo & branch)"
                checkout scm
                sh 'echo "Checkout done. Commit: $(git rev-parse --short HEAD)"'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest ."
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDENTIALS}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh "echo \"\$DOCKER_PASS\" | docker login -u \"\$DOCKER_USER\" --password-stdin"
                    sh "docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    // Replace 'deployment.yaml' with your actual Kubernetes deployment file
                    sh "kubectl apply -f values.yaml --kubeconfig=${KUBE_CONFIG}"
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful!"
        }
        failure {
            echo "❌ Deployment failed!"
        }
    }
}

