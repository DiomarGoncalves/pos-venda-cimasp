import sys
from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QLabel, QLineEdit, QPushButton, QTextEdit
from migrador import migrar_banco

class App(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Migrador PostgreSQL")
        self.setGeometry(100, 100, 600, 300)

        layout = QVBoxLayout()

        self.origem_label = QLabel("🔐 URL do banco de origem (Neon):")
        self.origem_input = QLineEdit()
        layout.addWidget(self.origem_label)
        layout.addWidget(self.origem_input)

        self.destino_label = QLabel("🖥️ URL do banco de destino (Local):")
        self.destino_input = QLineEdit()
        layout.addWidget(self.destino_label)
        layout.addWidget(self.destino_input)

        self.btn_migrar = QPushButton("🚀 Migrar Dados")
        self.btn_migrar.clicked.connect(self.executar_migracao)
        layout.addWidget(self.btn_migrar)

        self.status = QTextEdit()
        self.status.setReadOnly(True)
        layout.addWidget(self.status)

        self.setLayout(layout)

    def executar_migracao(self):
        origem = self.origem_input.text()
        destino = self.destino_input.text()

        self.status.setText("⏳ Iniciando migração...")
        QApplication.processEvents()
        try:
            migrar_banco(origem, destino)
            self.status.setText("✅ Migração concluída com sucesso!")
        except Exception as e:
            self.status.setText(f"❌ Erro durante migração:\n{str(e)}")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    janela = App()
    janela.show()
    sys.exit(app.exec_())
