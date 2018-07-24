import {Component, OnInit} from '@angular/core';
import {UserService} from '../services/user.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {first} from 'rxjs/internal/operators';
import {compileDirective} from '@angular/compiler/src/render3/r3_view_compiler';
import {timer} from 'rxjs/index';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  set error(value: string) {
    this._error = value;
    if (value === 'SUCCESS !') {
      timer(3000).subscribe(() => this.error = '');
    }
  }

  get error() {
    return this._error;
  }

  private _error: string = '';

  public formProfile: FormGroup;
  public formEmail: FormGroup;
  public formPassword: FormGroup;
  public user;
  public isEmailPasswordAccount: boolean = false;
  private picture: File;
  public submitted = {
    profile: false,
    email: false,
    password: false,
  };


  constructor(private fb: FormBuilder, private userService: UserService) {
    this.createForm();
  }

  private createForm(): void {
    this.formProfile = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      last_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      language: ['', [Validators.required, Validators.pattern(/^en|fr$/)]],
      login: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      picture: ['', []],
      picture_url: ['', [Validators.required]]
    });

    this.formEmail = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.formPassword = this.fb.group({
      password: ['', [Validators.required, Validators.pattern(/^.*[A-Z]|[0-9].*$/)]],
      password_confirmation: ['', [Validators.required, Validators.pattern(/^.*[A-Z]|[0-9].*$/)]],
      old_password: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.userService.user.pipe(first(user => !!user)).subscribe(user => {
      this.user = user;
      this.isEmailPasswordAccount = !!this.userService.provider;
      this.formProfile.patchValue(user);
      this.formEmail.patchValue(user);
    });
  }

  public onSubmitProfile() {
    this.submitted.profile = true;
    if (this.formProfile.valid) {
      this.userService.updateProfile({...this.formProfile.value, picture: this.picture})
        .then(() => this.error = 'SUCCESS !')
        .catch(error => this.error = error);
    }
  }

  public onSubmitEmail() {
    this.submitted.email = true;
    if (this.formEmail.valid) {
      this.userService.updateEmail(this.formEmail.value.email, this.formEmail.value.password)
        .then(() => {
          this.error = 'SUCCESS !';
          this.formEmail.get('password').reset();
          this.submitted.email = false;
        })
        .catch(error => this.error = error);
    }
    if (!this.formEmail.get('password').valid) {
      this.error = 'Password much match a capital letter or a number and at least 6 chars !';
    }
  }

  public onSubmitPassword() {
    this.submitted.password = true;
    if (this.formPassword.valid) {
      const password: string = this.formPassword.value.password;
      const old: string = this.formPassword.value.old_password;

      if (password === this.formPassword.value.password_confirmation) {
        return this.userService.updatePassword(password, old)
          .then(() => {
            this.error = 'SUCCESS !';
            this.formPassword.reset();
            this.submitted.password = false;
          })
          .catch(error => this.error = error);
      }
      this.error = 'Passwords do not match !';
    }
    if (!this.formPassword.get('password').valid) {
      this.error = 'Password much match a capital letter or a number and at least 6 chars !';
    }
  }

  onFileChange(e) {
    if (e.target.files && e.target.files.length > 0) {
      this.picture = e.target.files[0];
      if (this.picture.size > 2097152 /* 2 * 1024 * 1024 */ || !this.picture.type.match(/^image\/.+$/)) {
        this.formProfile.get('picture').setValue('');
      }
    }
  }
}
