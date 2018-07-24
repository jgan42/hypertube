import {Component} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {UserService} from '../../services/user.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['../auth.component.scss', './sign-in.component.scss'],
})
export class SignInComponent {
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
      password: ['', [Validators.required]],
    });
  }

  public onSubmit(): void {
    this.submitted = true;

    if (this.form.valid) {
      this.error = '';
      this.userService.signIn(this.form.value.email, this.form.value.password)
        .catch(err => this.error = 'Email or password is invalid');
    }
  }
}
