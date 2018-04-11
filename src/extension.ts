'use strict';

import * as vscode from 'vscode';
import Resolver from './Resolver';

function activate(context: vscode.ExtensionContext) {
    const resolver = new Resolver();

    const insertGetter = vscode.commands.registerCommand('phpGettersSetters.insertGetter', () => resolver.insertGetter());
    const insertSetter = vscode.commands.registerCommand('phpGettersSetters.insertSetter', () => resolver.insertSetter());
    const insertGetterAndSetter = vscode.commands.registerCommand('phpGettersSetters.insertGetterAndSetter', () => resolver.insertGetterAndSetter());

    context.subscriptions.push(insertGetter);
    context.subscriptions.push(insertSetter);
    context.subscriptions.push(insertGetterAndSetter);
}

function deactivate() {}

exports.activate = activate;
exports.deactivate = deactivate;
