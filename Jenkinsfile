pipeline {
    agent any

    environment {
        // Docker Hub credentials (stored in Jenkins Credentials)
        DOCKERHUB_CREDENTIALS = "${DOCKERHUB_CREDENTIALS}"
        DOCKERHUB_USERNAME = "${DOCKERHUB_USERNAME}"
        IMAGE_NAME = "${IMAGE_NAME}"
        KUBE_CONFIG = '/root/.kube/config' // path to kubeconfig in Jenkins node
    }

    triggers {
        // Trigger on every push to GitHub (requires GitHub webhook: repo → Settings → Webhooks → add Jenkins URL e.g. https://your-jenkins/github-webhook/)
        githubPush()
    }

    stages {
        stage('1.Clone repository') {
        checkout scm
       }

        stage('Build Docker Image') {
            // steps {
            //     script {
            //         docker.build("${IMAGE_NAME}:${env.BUILD_NUMBER}")
            //     }
            // }
             sh "docker build -t ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest ."
        }

        stage('Push Docker Image') {
                // steps {
                //     script {
                //         docker.withRegistry('https://index.docker.io/v1/', "${DOCKERHUB_CREDENTIALS}") {
                //             docker.image("${IMAGE_NAME}:${env.BUILD_NUMBER}").push()
                //             // Optional: also tag as latest
                //             docker.image("${IMAGE_NAME}:${env.BUILD_NUMBER}").push('latest')
                //         }
                //     }
                // }
                sh "docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest"
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