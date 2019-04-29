import { IElement, IQuestion, PanelModelBase, PanelModel, QuestionRowModel } from 'survey-core';
import { PdfSurvey } from '../survey';
import { IPdfBrick } from '../pdf_render/pdf_brick';
import { IPoint, DocController } from "../doc_controller";
import { FlatRepository } from './flat_repository';
import { IFlatQuestion } from './flat_question';
import { SurveyHelper } from '../helper_survey';

export class FlatSurvey {
    static parseWidth(width: string): number {
        return parseFloat(width) / 100.0;
    }
    private static generateFlatsPagePanel(pagePanel: PanelModelBase,
        controller: DocController, point: IPoint): IPdfBrick[] {
        if (!pagePanel.isVisible) return;
        pagePanel.onFirstRendering();
        let pagePanelFlats: IPdfBrick[] = new Array<IPdfBrick>();
        pagePanel.rows.forEach((row: QuestionRowModel) => {
            if (!row.visible) return;
            let width: number = controller.paperWidth -
                controller.margins.marginLeft - controller.margins.marginRight;
            let oldMarginLeft: number = controller.margins.marginLeft;
            let oldMarginRight: number = controller.margins.marginRight;
            let currMarginLeft: number = controller.margins.marginLeft;
            let rowFlats: IPdfBrick[] = new Array();
            row.elements.forEach((question: IElement) => {
                let persWidth: number = width * FlatSurvey.parseWidth(question.renderWidth);
                controller.margins.marginLeft = currMarginLeft;
                controller.margins.marginRight = controller.paperWidth -
                    currMarginLeft - persWidth;
                currMarginLeft = controller.paperWidth - controller.margins.marginRight;
                let flatQuestion: IFlatQuestion =
                    FlatRepository.getInstance().create(<IQuestion>question, controller);
                point.xLeft = controller.margins.marginLeft;
                rowFlats.push(...flatQuestion.generateFlats(point));
            });
            controller.margins.marginLeft = oldMarginLeft;
            controller.margins.marginRight = oldMarginRight;
            point.xLeft = controller.margins.marginLeft;
            if (rowFlats.length != 0) {
                point.yTop = SurveyHelper.mergeRects(...rowFlats).yBot;
                point.yTop += SurveyHelper.measureText().height;
                pagePanelFlats.push(...rowFlats);
            }
        });
        return pagePanelFlats;
    }
    static generateFlats(survey: PdfSurvey): IPdfBrick[][] {
        let flats: IPdfBrick[][] = new Array<IPdfBrick[]>();
        survey.pages.forEach((page: PanelModelBase) => {
            flats.push(this.generateFlatsPagePanel(page, survey.controller, survey.controller.leftTopPoint));
        });
        return flats;
    }
}