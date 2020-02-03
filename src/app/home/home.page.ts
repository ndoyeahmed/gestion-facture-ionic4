import {Component} from '@angular/core';
import {NavController, Platform} from '@ionic/angular';
import * as moment from 'moment';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

import {File} from '@ionic-native/file/ngx';
import {FileOpener} from '@ionic-native/file-opener/ngx';
import {Data} from '../data/data';
import { Camera } from '@ionic-native/camera/ngx';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {

    pageSizeData = (new Data()).pageSizeFormatList();
    pageOrientationData = (new Data()).pageOrientation();
    pageFormat: string;
    pageOrientation: string;
    client: string;
    objet: string;
    totalFacture = 0;
    totalFactureLettre: string;
    listeItem = [];
    list = [];
    contentObj = {
        description: undefined,
        prix: undefined
    };

    letterObj = {
        to: '',
        from: '',
        text: ''
    };

    pdfObj = null;

  private base64Image: string;
  private picture: any;

    constructor(public navCtrl: NavController,
                private plt: Platform, private file: File,
                private fileOpener: FileOpener,
                private camera: Camera,
                private sanitizer: DomSanitizer) {
    }

    transform(url) {
        return this.sanitizer.bypassSecurityTrustUrl(url);
    }

    async createPdf() {
        if (this.client && this.objet && this.listeItem && this.listeItem.length > 0 && this.totalFactureLettre) {
            const docDefinition = {
                content: [
                    {
                        columns: [
                            {
                                // if you specify both width and height - image will be stretched
                                image: this.base64Image,
                                width: 65,
                                height: 65,
                            },
                            {
                                // percentage width
                                width: '85%',
                                text: 'Dakar le ' + moment(new Date()).format('DD/MM/YYYY'),
                                alignment: 'right'
                            }
                        ],
                    },
                    {
                        columns: [
                            {
                                // percentage width
                                width: '100%',
                                text: 'GIE Prestige A\nSébikotane',
                                alignment: 'left',
                                margin: [0, 5, 0, 40],
                                bold: true
                            }
                        ],
                    },
                    {
                        // percentage width
                        text: 'Facture',
                        alignment: 'center',
                        margin: [0, 0, 0, 50],
                        fontSize: 24,
                        bold: true
                    },
                    {
                        // percentage width
                        text: 'Client : ' + this.client,
                        alignment: 'left',
                        margin: [0, 0, 0, 5],
                        fontSize: 14,
                        bold: true
                    },
                    {
                        // percentage width
                        text: 'Objet : ' + this.objet,
                        alignment: 'left',
                        margin: [0, 0, 0, 30],
                        fontSize: 14,
                        bold: true
                    },

                    this.table(this.listeItem, ['description', 'prix']),

                    {
                        // percentage width
                        text: 'Total : ' + this.totalFacture,
                        alignment: 'right',
                        margin: [0, 40, 0, 50],
                        fontSize: 14,
                        bold: true
                    },
                    {
                        // percentage width
                        text: 'Arrété la présente facture à la somme de ' + this.totalFactureLettre + ' francs CFA',
                        alignment: 'left',
                        margin: [0, 0, 0, 30]
                    },
                    {
                        // percentage width
                        text: 'Le Président',
                        alignment: 'right',
                        bold: true
                    }

                ],
                // a string or { width: number, height: number }
                pageSize: this.pageFormat ? this.pageFormat : 'A4',

                // by default we use portrait, you can change it to landscape if you wish
                pageOrientation: this.pageOrientation ? this.pageOrientation : 'portrait'
            };
            this.pdfObj = pdfMake.createPdf(docDefinition);

            if (this.plt.is('cordova')) {
                await this.plt.ready();
                this.pdfObj.getBuffer((buffer) => {
                    const blob = new Blob([buffer], {type: 'application/pdf'});

                    // Save the PDF to the data Directory of our App
                    this.file.writeFile(this.file.dataDirectory, 'facture.pdf', blob, {replace: true}).then(fileEntry => {
                        // Open the PDf with the correct OS tools
                        this.fileOpener.open(this.file.dataDirectory + 'facture.pdf', 'application/pdf');
                    });
                });
            } else {
                // On a browser simply use download!
                this.pdfObj.download();
            }
        } else {
            console.log('remplir tous les champs svp');
        }
    }

    onSelectFormatChange($event: CustomEvent) {
        this.pageFormat = $event.detail.value;
        console.log(this.pageFormat);
    }

    onChangePageOrientation($event: CustomEvent) {
        this.pageOrientation = $event.detail.value;
        console.log(this.pageOrientation);
    }

    addItem() {
        this.totalFacture = this.totalFacture + this.contentObj.prix;
        this.listeItem.push(this.contentObj);
        this.contentObj = {description: undefined, prix: undefined};
    }

    buildTableBody(data, columns) {
        const body = [];

        body.push(columns);

        data.forEach((row) => {
            const dataRow = [];

            columns.forEach((column) => {
                dataRow.push(row[column].toString());
            });
            body.push(dataRow);
        });

        return body;
    }

    table(data, columns) {
        return {
            table: {
                headerRows: 1,
                widths: ['*', '*'],
                body: this.buildTableBody(data, columns)
            }
        };
    }

    AccessCamera() {

        this.camera.getPicture({

            targetWidth: 512,

            targetHeight: 512,

            correctOrientation: true,

            sourceType: this.camera.PictureSourceType.CAMERA,

            destinationType: this.camera.DestinationType.DATA_URL

        }).then((imageData) => {

            this.base64Image = 'data:image/jpeg;base64,' + imageData;

            this.picture = imageData;

        }, (err) => {

            console.log(err);

        });

    }

    AccessGallery() {

        this.camera.getPicture({

            sourceType: this.camera.PictureSourceType.SAVEDPHOTOALBUM,

            destinationType: this.camera.DestinationType.DATA_URL

        }).then((imageData) => {

            this.base64Image = 'data:image/jpeg;base64,' + imageData;

            this.picture = imageData;

        }, (err) => {

            console.log(err);

        });

    }

}
