pipeline {
    agent any

    environment {
        // Docker Hub credentials (stored in Jenkins Credentials)
        DOCKERHUB_CREDENTIALS = 'dockerhub-cred-id'
        DOCKERHUB_USERNAME = 'your-dockerhub-username'
        IMAGE_NAME = 'your-dockerhub-username/angular-app'
        KUBE_CONFIG = '/root/.kube/config' // path to kubeconfig in Jenkins node
    }

    triggers {
        // Trigger on every push to GitHub (requires GitHub webhook: repo → Settings → Webhooks → add Jenkins URL e.g. https://your-jenkins/github-webhook/)
        githubPush()
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/minkhant1999/angular-docker-k8s-jenkins.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    docker.build("${IMAGE_NAME}:${env.BUILD_NUMBER}")
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKERHUB_CREDENTIALS}") {
                        docker.image("${IMAGE_NAME}:${env.BUILD_NUMBER}").push()
                        // Optional: also tag as latest
                        docker.image("${IMAGE_NAME}:${env.BUILD_NUMBER}").push('latest')
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    // Replace 'deployment.yaml' with your actual Kubernetes deployment file
                    sh "kubectl apply -f deployment.yaml --kubeconfig=${KUBE_CONFIG}"
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