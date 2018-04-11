import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as mockery from 'mockery';
import * as vscode from './stubs/vscode';

mockery.enable({
    warnOnUnregistered: false
});
mockery.registerMock('vscode', vscode);

import Resolver from './Resolver';
import Property from './Property';

describe('Resolver test', () => {
    let resolver: Resolver;
    const prop = Object.assign(new Property('name'), {
        type: 'string',
        indentation: '    '
    });
    const loadFixture = (name: string): string => {
        const filename = path.join(__dirname, 'fixtures', name + '.txt');
        return fs.readFileSync(filename).toString();
    };

    beforeEach(() => {
        resolver = new Resolver();
    });

    it('should load raw template', () => {
        const tmpl = resolver.compileTemplate('getter');
        expect(tmpl).to.be.a('string');
    });

    it('should match the getter fixture', () => {
        const fixture = loadFixture('getter');
        const tmpl = resolver.getterTemplate(prop);
        expect(tmpl).to.equal(fixture);
    });

    it('should match the setter fixture', () => {
        const fixture = loadFixture('setter');
        const tmpl = resolver.setterTemplate(prop);
        expect(tmpl).to.equal(fixture);
    });
});
