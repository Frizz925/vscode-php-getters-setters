import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import Redirector from './Redirector';
import Property from './Property';
import Configuration from './Configuration';

export default class Resolver {
    config: Configuration;

    /**
     * Types that won't be recognised as valid type hints
     */
    pseudoTypes = ['mixed', 'number', 'callback', 'object', 'void'];

    public constructor() {
        const editor = this.activeEditor();

        if (editor.document.languageId !== 'php') {
            throw new Error('Not a PHP file.');
        }

        this.config = new Configuration();
    }

    activeEditor() {
        return vscode.window.activeTextEditor;
    }

    closingClassLine() {
        const editor = this.activeEditor();

        for (let lineNumber = editor.document.lineCount - 1; lineNumber > 0; lineNumber--) {
            const line = editor.document.lineAt(lineNumber);
            const text = line.text.trim();

            if (text.startsWith('}')) {
                return line;
            }
        }

        return null;
    }

    insertGetter() {
        const editor = this.activeEditor();
        let property = null;
        let content = '';

        editor.selections.forEach(selection => {
            try {
                property = Property.fromEditorPosition(editor, selection.active);
            } catch (error) {
                this.showErrorMessage(error.message);
                return null;
            }

            content += this.getterTemplate(property);
        });

        this.renderTemplate(content);
    }

    insertGetterAndSetter() {
        const editor = this.activeEditor();
        let property = null;
        let content = '';

        editor.selections.forEach(selection => {
            try {
                property = Property.fromEditorPosition(editor, selection.active);
            } catch (error) {
                this.showErrorMessage(error.message);
                return null;
            }

            content += this.getterTemplate(property) + this.setterTemplate(property);
        });

        this.renderTemplate(content);
    }

    insertSetter() {
        const editor = this.activeEditor();
        let property = null;
        let content = '';

        editor.selections.forEach(selection => {
            try {
                property = Property.fromEditorPosition(editor, selection.active);
            } catch (error) {
                this.showErrorMessage(error.message);
                return null;
            }

            content += this.setterTemplate(property);
        });

        this.renderTemplate(content);
    }

    compileTemplate(name: string, map = {}): string {
        const filename = path.join(__dirname, 'templates', name + '.txt');
        let template = fs.readFileSync(filename).toString();
        Object.keys(map).forEach((key: string) => {
            template = template.replace(key, map[key]);
        });
        return template;
    }

    getterTemplate(prop: Property): string {
        const name = prop.getName();
        const description = prop.getDescription();
        const tab = prop.getIndentation();
        const type = prop.getType();
        const spacesAfterReturn = Array(this.config.getInt('spacesAfterReturn', 2) + 1).join(' ');
        const map = {
            name,
            type: type || 'mixed',
            getterName: 'get' + name[0].toUpperCase() + name.substr(1),
            description: description || 'Get the value of ' + name
        };

        return this.compileTemplate('getter', map)
            .replace('@return ', '@return' + spacesAfterReturn)
            .split('\n')
            .map(line => ('' === line ? '' : tab + line))
            .join('\n');
    }

    setterTemplate(prop: Property) {
        const name = prop.getName();
        const description = prop.getDescription();
        const tab = prop.getIndentation();
        const type = prop.getType() || 'mixed';
        const typeHint = prop.getTypeHint();
        const spacesAfterParam = Array(this.config.getInt('spacesAfterParam', 2) + 1).join(' ');
        const spacesAfterParamVar = Array(this.config.getInt('spacesAfterParamVar', 2) + 1).join(' ');
        const spacesAfterReturn = Array(this.config.getInt('spacesAfterReturn', 2) + 1).join(' ');
        const map = {
            name,
            setterName: 'set' + name[0].toUpperCase() + name.substr(1),
            description: description || 'Set the value of ' + name
        };

        return this.compileTemplate('setter', map)
            .replace('typeHint: ', typeHint || '')
            .replace('@param type ', '@param ' + type + spacesAfterParamVar)
            .replace('@param ', '@param' + spacesAfterParam)
            .replace('@return ', '@return' + spacesAfterReturn)
            .split('\n')
            .map(line => ('' === line ? '' : tab + line))
            .join('\n');
    }

    renderTemplate(template: string) {
        if (!template) {
            this.showErrorMessage('Missing template to render.');
            return;
        }

        const insertLine = this.insertLine();

        if (!insertLine) {
            this.showErrorMessage('Unable to detect insert line for template.');
            return;
        }

        const editor = this.activeEditor();
        const resolver = this;

        editor
            .edit((edit: vscode.TextEditorEdit) => {
                edit.replace(new vscode.Position(insertLine.lineNumber, 0), template);
            })
            .then(
                success => {
                    if (resolver.isRedirectEnabled() && success) {
                        const redirector = new Redirector(editor);
                        redirector.goToLine(this.closingClassLine().lineNumber - 1);
                    }
                },
                error => {
                    this.showErrorMessage(`Error generating functions: ` + error);
                }
            );
    }

    insertLine() {
        return this.closingClassLine();
    }

    isRedirectEnabled(): boolean {
        return true === this.config.get('redirect', true);
    }

    showErrorMessage(message: string) {
        message = 'phpGettersSetters error: ' + message.replace(/\$\(.+?\)\s\s/, '');

        vscode.window.showErrorMessage(message);
    }

    showInformationMessage(message: string) {
        message = 'phpGettersSetters info: ' + message.replace(/\$\(.+?\)\s\s/, '');

        vscode.window.showInformationMessage(message);
    }
}
