import type { TranslationOverrides } from './define-locale'

export const itReused = {
  connectorsPage: {
    tools: {
      title: 'Strumenti'
    }
  },
  settings: {
    plugins: {
      installModal: {
        installing: 'Installazione…'
      }
    },
    vault: {
      sources: {
        title: 'Gestori di password'
      }
    },
    customEndpoints: {
      contextPlaceholder: 'Automatica'
    },
    model: {
      auxiliaryTitle: 'Modelli ausiliari',
      moaTitle: 'Combinazione di agenti'
    },
    billing: {
      plan: {
        title: 'Piani'
      }
    },
    toolsets: {
      postSetupRunning: 'Installazione…'
    }
  },
  skills: {
    tabToolsets: 'Strumenti'
  },
  commandCenter: {
    pets: {
      placeholder: 'Cerca mascotte…',
      generatedTag: 'Generata'
    },
    generatePet: {
      namePlaceholder: 'Dai un nome alla mascotte'
    }
  },
  profiles: {
    autoColor: 'Automatica'
  },
  shell: {
    statusbar: {
      toggleApprovalMode: 'Approvazioni'
    }
  },
  assistant: {
    catalogInstall: {
      installing: 'Installazione…'
    }
  }
} satisfies TranslationOverrides
