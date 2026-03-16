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
        // Trigger on every push to GitHub (requires GitHub webhook: repo → Settings → Webhooks → add Jenkins URL e.g. https://your-jenkins/github-webhook/)
        githubPush()
    }

    stages {
        stage('1.Clone repository') {
            steps {
                checkout scm
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