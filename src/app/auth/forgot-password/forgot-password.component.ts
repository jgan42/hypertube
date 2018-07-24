import {Component} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {UserService} from '../../services/user.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../auth.component.scss', './forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  public form: FormGroup;
  public submitted: boolean = false;
  public error: string = '';

  constructor(private fb: FormBuilder,
              private userService: UserService) {
    this.createForm();
  }

  private createForm(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  public onSubmit(): void {
    this.submitted = true;

    if (this.form.valid) {
      this.error = '';
      this.userService.resetPassword(this.form.value.email)
        .then(user => this.error = 'An email has been sent to your email address')
        .catch(err => this.error = 'Email not found');
    }
  }
}
