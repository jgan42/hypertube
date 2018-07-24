import {Component, ElementRef, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {UserService} from '../../services/user.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['../auth.component.scss', './sign-up.component.scss']
})
export class SignUpComponent {
  public form: FormGroup;
  public submitted: boolean = false;
  public error: string = '';
  private picture: File;

  @ViewChild('fileInput') fileInput: ElementRef;

  constructor(private fb: FormBuilder,
              private userService: UserService) {
    this.createForm();
  }

  private createForm(): void {
    this.form = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      last_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      login: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^.*[A-Z]|[0-9].*$/)]],
      picture: ['', [Validators.required]],
      language: ['en', [Validators.required, Validators.pattern(/^en|fr$/)]],
    });
  }

  public onSubmit(): void {
    this.submitted = true;

    if (this.form.valid) {
      this.error = '';
      this.userService.signUp({...this.form.value, picture: this.picture})
        .catch(err => {
          if (err.code === 'auth/email-already-in-use') {
            this.error = 'This email is already used';
          } else {
            this.error = 'Something went wrong. Please try again';
          }
        });
    }
  }

  onFileChange(e) {
    if (e.target.files && e.target.files.length > 0) {
      this.picture = e.target.files[0];
      if (this.picture.size > 2097152 /* 2 * 1024 * 1024 */ || !this.picture.type.match(/^image\/.+$/))  {
        this.form.get('picture').setValue('');
      }
    }
  }
}
