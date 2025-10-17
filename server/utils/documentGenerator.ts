import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { promises as fs } from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { toWords } from 'number-to-words';

export class DocumentGenerator {
  /**
   * Convert number to Kenyan currency words
   */
  static formatCurrency(amount: number): string {
    return `KSh ${amount.toLocaleString('en-KE')}`;
  }

  /**
   * Convert amount to words for Kenyan shillings
   */
  static amountToWords(amount: number): string {
    const shillings = Math.floor(amount);
    const cents = Math.round((amount - shillings) * 100);
    
    let words = toWords(shillings).toUpperCase() + ' SHILLINGS';
    
    if (cents > 0) {
      words += ' AND ' + toWords(cents).toUpperCase() + ' CENTS';
    }
    
    return words + ' ONLY';
  }

  /**
   * Convert date to readable format
   */
  static formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'dd/MM/yyyy');
  }

  /**
   * Get financial year from date
   */
  static getFinancialYear(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    
    if (month >= 7) {
      return `${year}/${year + 1}`;
    } else {
      return `${year - 1}/${year}`;
    }
  }

  /**
   * Generate a claim document from template
   */
  static async generateClaimDocument(data: any): Promise<string> {
    const templatePath = path.join(process.cwd(), 'public/templates/claim.docx');
    const content = await fs.readFile(templatePath, 'binary');
    
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare template data
    const templateData = {
      txtname: data.name || '',
      txtdesignation: data.designation || '',
      txtjg: data.jg || '',
      txtdate_travel: this.formatDate(data.dated),
      txtdate_return: this.formatDate(data.dateReturn),
      txtamount: this.formatCurrency(data.amounts),
      txtamount_in_words: data.amountInWords || this.amountToWords(data.amounts),
      txtvote_id: data.voteId || '',
      txtvoted_item: data.descriptions || '',
      txtvoucher: data.voucherNo?.toUpperCase() || '',
      txtdays: data.days || '',
      txtreturn_info: data.returnInfo || '',
      txthead: data.head || '',
      txtvote: data.voteNo?.toUpperCase() || '',
      txtdestination: data.place || '',
      txtparticulars: data.particulars || '',
      txtvenue: data.destination || '',
      txtdescriptions: data.descriptions || '',
      txtsub_head: data.subHead || '',
      txtfy: this.getFinancialYear(data.dated),
      txtbus: this.formatCurrency(data.busFare || 0),
      txttaxi: this.formatCurrency(data.taxiFare || 0),
      txtperdiem: this.formatCurrency(data.perdiem || 0),
      txtsubsistence: this.formatCurrency(data.subsistence || 0),
      txtfare: this.formatCurrency(data.fare || 0),
      txttotal_balance: this.formatCurrency(data.balanceAfterCommitted || 0),
      txtallocation: this.formatCurrency(data.amountsAllocated || 0),
      txtbal_on_commit: this.formatCurrency(data.balanceBeforeCommitted || 0),
      txtvote_commited: this.formatCurrency(data.amoutsCommited || 0),
    };

    doc.render(templateData);

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const fileName = `claim_${Date.now()}.docx`;
    const outputPath = path.join(process.cwd(), 'public/exports', fileName);
    
    await fs.writeFile(outputPath, buffer);
    
    return fileName;
  }

  /**
   * Generate a payment document from template
   */
  static async generatePaymentDocument(data: any): Promise<string> {
    const templatePath = path.join(process.cwd(), 'public/templates/payment.docx');
    const content = await fs.readFile(templatePath, 'binary');
    
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare template data
    const templateData = {
      txtname: data.personalNo || '',
      txtdated: this.formatDate(data.dated),
      txtamount: this.formatCurrency(data.amounts),
      txtamount_in_words: data.amountInWords || this.amountToWords(data.amounts),
      txtvote_id: data.voteId || '',
      txtvote: data.voteNo?.toUpperCase() || '',
      txtvoted_item: data.descriptions || '',
      txtvoucher: data.voucherNo?.toUpperCase() || '',
      txthead: data.head || '',
      txtparticulars: data.particulars || '',
      txtdepartment: data.departmentName || '',
      txtsub_head: data.subHead || '',
      txtfy: this.getFinancialYear(data.dated),
      txtallocation: this.formatCurrency(data.amountsAllocated || 0),
      txtbal_on_commit: this.formatCurrency(data.balanceBeforeCommitted || 0),
      txtvote_commited: this.formatCurrency(data.amoutsCommited || 0),
      txttotal_balance: this.formatCurrency(data.balanceAfterCommitted || 0),
    };

    // Handle particulars array if exists
    if (data.particulars && Array.isArray(data.particulars)) {
      const particularsData = data.particulars.map((item: any) => ({
        particular: item.particular || '',
        payment: this.formatCurrency(item.payment || 0),
      }));
      
      // If template uses table loops, set the data
      Object.assign(templateData, { particulars: particularsData });
    }

    doc.render(templateData);

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const fileName = `payment_${Date.now()}.docx`;
    const outputPath = path.join(process.cwd(), 'public/exports', fileName);
    
    await fs.writeFile(outputPath, buffer);
    
    return fileName;
  }
}
