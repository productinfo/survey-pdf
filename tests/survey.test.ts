(<any>window)['HTMLCanvasElement'].prototype.getContext = () => {
    return {};
};

import { SurveyPDF } from '../src/survey';
import { FlatTextbox } from '../src/flat_layout/flat_textbox';
import { TestHelper } from '../src/helper_test';
import { DocController, DocOptions } from '../src/doc_controller';
let __dummy_tx = new FlatTextbox(null, null, null);

test('Check raw method', async () => {
    let json: any = {
        questions: [
            {
                type: 'text',
                name: 'survey_raw',
                titleLocation: 'hidden'
            }
        ]
    };
    let survey: SurveyPDF = new SurveyPDF(json, TestHelper.defaultOptions);
    let raw: string = await survey.raw();
    expect(raw.lastIndexOf('%PDF', 0) === 0).toBe(true);
});
test('Check raw method with dataurlstring parameter', async () => {
    let json: any = {
        questions: [
            {
                type: 'text',
                name: 'survey_rawdataurl',
                titleLocation: 'hidden'
            }
        ]
    };
    let survey: SurveyPDF = new SurveyPDF(json, TestHelper.defaultOptions);
    let raw: string = await survey.raw('dataurlstring');
    expect(raw.lastIndexOf('data:application/pdf', 0) === 0).toBe(true);
});

test('check that default font name is set correct in DocOptions', async () => {
    let opt = new DocOptions({});
    expect(opt.fontName).toEqual('helvetica');
    DocOptions.SEGOE_BOLD = 'seqoe_bold';
    DocOptions.SEGOE_NORMAL = 'seqoe_normal';
    opt = new DocOptions({});
    expect(opt.fontName).toEqual('segoe');
    opt = new DocOptions({ fontName: 'custom_font' });
    expect(opt.fontName).toEqual('custom_font');
    DocOptions.SEGOE_BOLD = undefined;
    DocOptions.SEGOE_NORMAL = undefined;
});

class Log {
    public log: string = ''
}
class SurveyPDFSaveTester extends SurveyPDF {
    private logger: Log;
    public setLog(logger: Log) {
        this.logger = logger;
    }
    protected async renderSurvey(controller: DocController) {
        this.logger.log += '->rendered';
        controller.doc.save = async () => {
            let promise = new Promise((resolve) => {
                this.logger.log += '->saving';
                resolve('saved');
            });
            promise.then(() => {
                this.logger.log += '->saved';
            });
            return promise;
        };
    }
}
test('check that save functions called sync if use correctly', async () => {
    const surveyPDF = new SurveyPDFSaveTester({});
    const logger = new Log();
    surveyPDF.setLog(logger);
    expect(await surveyPDF.save()).toBe('saved');
    expect(await surveyPDF.save()).toBe('saved');
    expect(await surveyPDF.save()).toBe('saved');
    expect(logger.log).toEqual('->rendered->saving->saved->rendered->saving->saved->rendered->saving->saved');
});

test('check that save functions called sync', async (done) => {
    const surveyPDF = new SurveyPDFSaveTester({});
    const logger = new Log();
    surveyPDF.setLog(logger);
    surveyPDF.save();
    surveyPDF.save();
    surveyPDF.save();
    setTimeout(() => {
        expect(logger.log).toEqual('->rendered->saving->saved->rendered->saving->saved->rendered->saving->saved');
        done();
    }, 1000);
});
