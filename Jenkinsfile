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

    stage('Deploy start') {
      steps {
        echo 'Hello'
      }
    }

    stage('Deploy end') {
      steps {
        echo 'Bye bye'
      }
    }
  }
}
