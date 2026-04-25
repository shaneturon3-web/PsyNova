import { Body, Controller, Post } from '@nestjs/common';
import { ContactFormDto } from './dto/contact-form.dto';
import { FormsService } from './forms.service';

@Controller('forms')
export class FormsController {
  constructor(private readonly forms: FormsService) {}

  @Post('contact')
  async contact(@Body() body: ContactFormDto) {
    return this.forms.submitContact(body);
  }
}
