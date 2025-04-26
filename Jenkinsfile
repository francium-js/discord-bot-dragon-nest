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
        yarn 'install'
      }
    }

    stage('Build project') {
      steps {
        yarn 'build'
      }
    }

    stage('Deploy start') {
      steps {
        echo 'Hello'
      }
    }

    stage('Deploy middle') {
      steps {
        echo 'Lmao'
      }
    }

    stage('Deploy end') {
      steps {
        echo 'Bye bye'
      }
    }
  }
}
