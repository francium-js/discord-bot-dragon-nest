pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install dependencies') {
      steps {
        sh 'yarn install'
      }
    }

    stage('Build project') {
      steps {
        sh 'yarn build'
      }
    }

    stage('Deploy (optional)') {
      steps {
        echo 'Hello'
      }
    }
  }
}
